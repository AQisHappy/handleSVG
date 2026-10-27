import { ContainerNotFoundError } from './errors/ContainerNotFoundError.ts';
import { DuplicateIdError } from './errors/DuplicateIdError.ts';
import { InvalidOperationError } from './errors/InvalidOperationError.ts';
import { NotContainerError } from './errors/NotContainerError.ts';
import { ShapeNotFoundError } from './errors/ShapeNotFoundError.ts';
import type { ShapeLocation } from './ShapeLocation.ts';
import { GroupShape } from './shapes/GroupShape.ts';
import type { Shape } from './shapes/Shape.ts';

export class Document {
  private canvasWidth: number;
  private canvasHeight: number;
  private readonly rootShapes: Shape[];
  private readonly shapesById: Map<string, Shape>;

  constructor(width = 800, height = 600) {
    this.assertCanvasSize(width, height);
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.rootShapes = [];
    this.shapesById = new Map<string, Shape>();
  }

  get width(): number { return this.canvasWidth; }
  get height(): number { return this.canvasHeight; }
  get size(): number { return this.shapesById.size; }

  setCanvasSize(width: number, height: number): void {
    this.assertCanvasSize(width, height);
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  addShape(shape: Shape, containerId?: string): Shape {
    const parentId = containerId ?? null;
    const index = parentId === null ? this.rootShapes.length : this.requireContainer(parentId).childCount;
    return this.insertShape(shape, parentId, index);
  }

  insertShape(shape: Shape, containerId: string | null, index: number): Shape {
    if (shape.getParent() !== null) {
      throw new InvalidOperationError(`shape already has a parent: ${shape.id}`);
    }

    const subtree = [shape, ...this.getSubtree(shape)];
    this.assertSubtreeAvailable(subtree);
    const container = containerId === null ? null : this.requireContainer(containerId);
    const length = container === null ? this.rootShapes.length : container.childCount;

    if (!Number.isInteger(index) || index < 0 || index > length) {
      throw new InvalidOperationError(`invalid child index: ${index}`);
    }

    if (container === null) this.rootShapes.splice(index, 0, shape);
    else container.insertChild(index, shape);

    for (const node of subtree) this.shapesById.set(node.id, node);
    return shape;
  }

  hasShape(id: string): boolean { return this.shapesById.has(id); }
  find(id: string): Shape | undefined { return this.shapesById.get(id); }

  getShape(id: string): Shape {
    const shape = this.find(id);
    if (shape === undefined) throw new ShapeNotFoundError(id);
    return shape;
  }

  getLocation(id: string): ShapeLocation {
    const shape = this.getShape(id);
    const parent = shape.getParent();
    const index = parent === null ? this.rootShapes.indexOf(shape) : parent.getChildIndex(id);
    if (index < 0) throw new InvalidOperationError(`shape is not attached to the document: ${id}`);
    return { containerId: parent?.id ?? null, index };
  }

  getParent(id: string): GroupShape | null { return this.getShape(id).getParent(); }
  getRootShapes(): readonly Shape[] { return this.rootShapes; }

  getChildren(id: string): readonly Shape[] {
    const shape = this.getShape(id);
    if (!(shape instanceof GroupShape)) throw new NotContainerError(id);
    return shape.children;
  }

  getAllShapes(): readonly Shape[] {
    const result: Shape[] = [];
    const visit = (shape: Shape): void => {
      result.push(shape);
      if (shape instanceof GroupShape) for (const child of shape.children) visit(child);
    };
    for (const root of this.rootShapes) visit(root);
    return result;
  }

  move(id: string, dx: number, dy: number): void { this.getShape(id).move(dx, dy); }
  scale(id: string, factor: number): void { this.getShape(id).scale(factor); }
  setAttribute(id: string, name: string, value: string): void { this.getShape(id).setAttribute(name, value); }

  moveShape(id: string, containerId: string | null, index: number): void {
    const shape = this.getShape(id);
    const container = containerId === null ? null : this.requireContainer(containerId);

    if (container === shape) throw new InvalidOperationError(`cannot add container to itself: ${id}`);
    if (container !== null && shape instanceof GroupShape && shape.contains(container)) {
      throw new InvalidOperationError(`cannot add a container into its own descendant: ${shape.id}`);
    }

    const length = container === null ? this.rootShapes.length : container.childCount;
    if (!Number.isInteger(index) || index < 0 || index > length) {
      throw new InvalidOperationError(`invalid child index: ${index}`);
    }

    this.detach(shape);
    if (container === null) this.rootShapes.splice(Math.min(index, this.rootShapes.length), 0, shape);
    else container.insertChild(Math.min(index, container.childCount), shape);
  }

  delete(id: string): Shape {
    const shape = this.getShape(id);
    const idsToRemove = [shape.id, ...this.getSubtree(shape).map((node) => node.id)];
    this.detach(shape);
    for (const nodeId of idsToRemove) this.shapesById.delete(nodeId);
    return shape;
  }

  group(newGroupId: string, shapeIds: readonly string[]): GroupShape {
    if (shapeIds.length === 0) throw new InvalidOperationError('group requires at least one shape');
    if (this.shapesById.has(newGroupId)) throw new DuplicateIdError(newGroupId);

    const uniqueIds = new Set(shapeIds);
    if (uniqueIds.size !== shapeIds.length) throw new InvalidOperationError('group contains duplicate shape id');

    const selected = shapeIds.map((id) => this.getShape(id));
    const first = selected[0];
    if (first === undefined) throw new InvalidOperationError('group requires at least one shape');

    for (const shape of selected) {
      if (shape instanceof GroupShape) {
        for (const other of selected) {
          if (other !== shape && shape.contains(other)) {
            throw new InvalidOperationError(`cannot group a container into its own descendant: ${shape.id}`);
          }
        }
      }
    }

    const group = new GroupShape(newGroupId);
    const anchorParent = first.getParent();
    const insertionIndex = this.getDetachedInsertionIndex(first, selected);
    for (const shape of selected) this.detach(shape);
    for (const shape of selected) group.addChild(shape);

    if (anchorParent === null) this.rootShapes.splice(insertionIndex, 0, group);
    else anchorParent.insertChild(insertionIndex, group);

    this.shapesById.set(group.id, group);
    return group;
  }

  ungroup(groupId: string): readonly Shape[] {
    const shape = this.getShape(groupId);
    if (!(shape instanceof GroupShape)) throw new NotContainerError(groupId);
    if (shape.getParent() === null) {
      throw new InvalidOperationError(`cannot ungroup top-level container: ${groupId}`);
    }
    return this.dissolveGroup(groupId);
  }

  /** @internal Used by command undo after the user-facing top-level check. */
  dissolveGroup(groupId: string): readonly Shape[] {
    const shape = this.getShape(groupId);
    if (!(shape instanceof GroupShape)) throw new NotContainerError(groupId);

    const parent = shape.getParent();
    const insertionIndex = parent === null ? this.rootShapes.indexOf(shape) : parent.getChildIndex(groupId);
    if (insertionIndex < 0) throw new InvalidOperationError(`shape is not attached to the document: ${groupId}`);

    const children = shape.removeAllChildren();
    if (parent === null) {
      this.rootShapes.splice(insertionIndex, 1);
      shape.setParent(null);
    } else {
      parent.removeChild(groupId);
    }
    this.shapesById.delete(groupId);

    for (const [offset, child] of children.entries()) {
      if (parent === null) this.rootShapes.splice(insertionIndex + offset, 0, child);
      else parent.insertChild(insertionIndex + offset, child);
    }
    return children;
  }

  addto(groupId: string, shapeId: string): void {
    const target = this.requireContainer(groupId);
    const shape = this.getShape(shapeId);
    if (shape === target) throw new InvalidOperationError(`cannot add container to itself: ${groupId}`);
    if (shape instanceof GroupShape && shape.contains(target)) {
      throw new InvalidOperationError(`cannot add a container into its own descendant: ${shape.id}`);
    }

    this.detach(shape);
    target.addChild(shape);
  }

  bringToFront(id: string): void {
    const shape = this.getShape(id);
    const parent = shape.getParent();
    if (parent === null) {
      this.rootShapes.splice(this.rootShapes.indexOf(shape), 1);
      this.rootShapes.push(shape);
      return;
    }
    parent.bringChildToFront(id);
  }

  sendToBack(id: string): void {
    const shape = this.getShape(id);
    const parent = shape.getParent();
    if (parent === null) {
      this.rootShapes.splice(this.rootShapes.indexOf(shape), 1);
      this.rootShapes.unshift(shape);
      return;
    }
    parent.sendChildToBack(id);
  }

  private requireContainer(id: string): GroupShape {
    const container = this.find(id);
    if (container === undefined) throw new ContainerNotFoundError(id);
    if (!(container instanceof GroupShape)) throw new NotContainerError(id);
    return container;
  }

  private assertSubtreeAvailable(subtree: readonly Shape[]): void {
    const seen = new Set<string>();
    for (const node of subtree) {
      if (seen.has(node.id) || this.shapesById.has(node.id)) throw new DuplicateIdError(node.id);
      seen.add(node.id);
    }
  }

  private getSubtree(shape: Shape): Shape[] {
    return shape instanceof GroupShape ? shape.getDescendants() : [];
  }

  private detach(shape: Shape): void {
    const parent = shape.getParent();
    if (parent !== null) {
      parent.removeChild(shape.id);
      return;
    }
    const index = this.rootShapes.indexOf(shape);
    if (index < 0) throw new InvalidOperationError(`shape is not attached to the document: ${shape.id}`);
    this.rootShapes.splice(index, 1);
    shape.setParent(null);
  }

  private getDetachedInsertionIndex(anchor: Shape, selected: readonly Shape[]): number {
    const anchorParent = anchor.getParent();
    const indexes: number[] = [];

    for (const shape of selected) {
      if (shape.getParent() !== anchorParent) continue;
      const index = anchorParent === null
        ? this.rootShapes.indexOf(shape)
        : anchorParent.getChildIndex(shape.id);
      if (index >= 0) indexes.push(index);
    }

    if (indexes.length === 0) {
      throw new InvalidOperationError(`shape is not attached to the document: ${anchor.id}`);
    }

    return Math.min(...indexes);
  }

  private assertCanvasSize(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new InvalidOperationError('canvas width and height must be positive');
    }
  }
}