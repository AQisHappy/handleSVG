import { InvalidOperationError } from '../errors/InvalidOperationError.ts';
import { InvalidValueError } from '../errors/InvalidValueError.ts';
import { UnknownAttributeError } from '../errors/UnknownAttributeError.ts';
import type { GroupShape } from './GroupShape.ts';
import type { ShapeKind } from './ShapeKind.ts';

const STYLE_ATTRIBUTE_NAMES = new Set(['fill', 'stroke', 'stroke-width']);

export abstract class Shape {
  private readonly shapeId: string;
  private parentGroup: GroupShape | null;
  private readonly styleValues: Map<string, string>;

  protected constructor(id: string) {
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new InvalidOperationError('shape id must not be empty');
    }
    this.shapeId = id;
    this.parentGroup = null;
    this.styleValues = new Map<string, string>();
  }

  get id(): string { return this.shapeId; }
  abstract get kind(): ShapeKind;
  getParent(): GroupShape | null { return this.parentGroup; }

  /** @internal Parent changes are coordinated by GroupShape and Document. */
  setParent(parent: GroupShape | null): void { this.parentGroup = parent; }

  move(dx: number, dy: number): void {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
      throw new InvalidOperationError('move distances must be finite numbers');
    }
    this.moveGeometry(dx, dy);
  }

  scale(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new InvalidOperationError('scale factor must be positive');
    }
    this.scaleGeometry(factor);
  }

  setAttribute(name: string, value: string): void {
    if (STYLE_ATTRIBUTE_NAMES.has(name)) {
      this.styleValues.set(name, value);
      return;
    }
    if (!this.applyOwnAttribute(name, value)) {
      throw new UnknownAttributeError(name);
    }
  }

  unsetAttribute(name: string): void {
    if (!STYLE_ATTRIBUTE_NAMES.has(name)) {
      throw new InvalidOperationError(`attribute cannot be removed: ${name}`);
    }
    this.styleValues.delete(name);
  }

  getAttribute(name: string): string | undefined {
    const geometryValue = this.getGeometryAttributes()[name];
    return geometryValue !== undefined ? String(geometryValue) : this.styleValues.get(name);
  }

  getAttributes(): Readonly<Record<string, string>> {
    const attributes: Record<string, string> = {};
    for (const [name, value] of Object.entries(this.getGeometryAttributes())) {
      attributes[name] = String(value);
    }
    for (const [name, value] of this.styleValues) {
      attributes[name] = value;
    }
    return attributes;
  }

  abstract getGeometryAttributes(): Readonly<Record<string, number>>;
  protected abstract moveGeometry(dx: number, dy: number): void;
  protected abstract scaleGeometry(factor: number): void;
  protected abstract applyOwnAttribute(name: string, value: string): boolean;

  protected parseNumber(attribute: string, value: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new InvalidValueError(attribute, value);
    return parsed;
  }

  protected parseNonNegativeNumber(attribute: string, value: string): number {
    const parsed = this.parseNumber(attribute, value);
    if (parsed < 0) throw new InvalidValueError(attribute, value);
    return parsed;
  }
}