import { InvalidOperationError } from '../errors/InvalidOperationError.ts';
import { ShapeNotFoundError } from '../errors/ShapeNotFoundError.ts';
import { Shape } from './Shape.ts';
import type { ShapeKind } from './ShapeKind.ts';

export class GroupShape extends Shape {
  private readonly childShapes: Shape[];

  constructor(id: string) {
    super(id);
    this.childShapes = [];
  }

  get kind(): ShapeKind { return 'g'; }
  get children(): readonly Shape[] { return this.childShapes; }
  get childCount(): number { return this.childShapes.length; }

  addChild(shape: Shape): void { this.insertChild(this.childShapes.length, shape); }

  insertChild(index: number, shape: Shape): void {
    if (!Number.isInteger(index) || index < 0 || index > this.childShapes.length) {
      throw new InvalidOperationError(`invalid child index: ${index}`);
    }
    if (shape === this) throw new InvalidOperationError(`cannot add container to itself: ${this.id}`);
    if (shape.getParent() !== null) throw new InvalidOperationError(`shape already has a parent: ${shape.id}`);
    if (shape instanceof GroupShape && shape.contains(this)) {
      throw new InvalidOperationError(`cannot add ancestor into descendant: ${shape.id}`);
    }
    this.childShapes.splice(index, 0, shape);
    shape.setParent(this);
  }

  removeChild(id: string): Shape {
    const index = this.getChildIndex(id);
    if (index < 0) throw new ShapeNotFoundError(id);
    const removed = this.childShapes.splice(index, 1)[0];
    if (removed === undefined) throw new ShapeNotFoundError(id);
    removed.setParent(null);
    return removed;
  }

  removeAllChildren(): Shape[] {
    const removed = [...this.childShapes];
    this.childShapes.length = 0;
    for (const child of removed) child.setParent(null);
    return removed;
  }

  getChildIndex(id: string): number {
    return this.childShapes.findIndex((child) => child.id === id);
  }

  bringChildToFront(id: string): void { this.addChild(this.removeChild(id)); }
  sendChildToBack(id: string): void { this.insertChild(0, this.removeChild(id)); }

  contains(shape: Shape): boolean {
    for (const child of this.childShapes) {
      if (child === shape || (child instanceof GroupShape && child.contains(shape))) return true;
    }
    return false;
  }

  getDescendants(): Shape[] {
    const descendants: Shape[] = [];
    for (const child of this.childShapes) {
      descendants.push(child);
      if (child instanceof GroupShape) descendants.push(...child.getDescendants());
    }
    return descendants;
  }

  getGeometryAttributes(): Readonly<Record<string, number>> { return {}; }
  protected moveGeometry(dx: number, dy: number): void { for (const child of this.childShapes) child.move(dx, dy); }
  protected scaleGeometry(factor: number): void { for (const child of this.childShapes) child.scale(factor); }
  protected applyOwnAttribute(_name: string, _value: string): boolean { return false; }
}