import { Shape } from './Shape.ts';
import type { ShapeKind } from './ShapeKind.ts';

export class LineShape extends Shape {
  private x1Value: number;
  private y1Value: number;
  private x2Value: number;
  private y2Value: number;

  constructor(id: string, x1: number, y1: number, x2: number, y2: number) {
    super(id);
    if (![x1, y1, x2, y2].every(Number.isFinite)) throw new Error('line geometry must be finite');
    this.x1Value = x1;
    this.y1Value = y1;
    this.x2Value = x2;
    this.y2Value = y2;
  }

  get kind(): ShapeKind { return 'line'; }
  get x1(): number { return this.x1Value; }
  get y1(): number { return this.y1Value; }
  get x2(): number { return this.x2Value; }
  get y2(): number { return this.y2Value; }

  getGeometryAttributes(): Readonly<Record<string, number>> {
    return { x1: this.x1Value, y1: this.y1Value, x2: this.x2Value, y2: this.y2Value };
  }

  protected moveGeometry(dx: number, dy: number): void {
    this.x1Value += dx; this.y1Value += dy; this.x2Value += dx; this.y2Value += dy;
  }
  protected scaleGeometry(factor: number): void {
    this.x1Value *= factor; this.y1Value *= factor; this.x2Value *= factor; this.y2Value *= factor;
  }

  protected applyOwnAttribute(name: string, value: string): boolean {
    if (name === 'x1') { this.x1Value = this.parseNumber(name, value); return true; }
    if (name === 'y1') { this.y1Value = this.parseNumber(name, value); return true; }
    if (name === 'x2') { this.x2Value = this.parseNumber(name, value); return true; }
    if (name === 'y2') { this.y2Value = this.parseNumber(name, value); return true; }
    return false;
  }
}