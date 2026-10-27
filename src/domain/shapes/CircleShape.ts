import { Shape } from './Shape.ts';
import type { ShapeKind } from './ShapeKind.ts';

export class CircleShape extends Shape {
  private cxValue: number;
  private cyValue: number;
  private radiusValue: number;

  constructor(id: string, cx: number, cy: number, radius: number) {
    super(id);
    if (![cx, cy, radius].every(Number.isFinite)) throw new Error('circle geometry must be finite');
    if (radius < 0) throw new Error('circle radius must not be negative');
    this.cxValue = cx;
    this.cyValue = cy;
    this.radiusValue = radius;
  }

  get kind(): ShapeKind { return 'circle'; }
  get cx(): number { return this.cxValue; }
  get cy(): number { return this.cyValue; }
  get r(): number { return this.radiusValue; }

  getGeometryAttributes(): Readonly<Record<string, number>> {
    return { cx: this.cxValue, cy: this.cyValue, r: this.radiusValue };
  }

  protected moveGeometry(dx: number, dy: number): void { this.cxValue += dx; this.cyValue += dy; }
  protected scaleGeometry(factor: number): void {
    this.cxValue *= factor; this.cyValue *= factor; this.radiusValue *= factor;
  }

  protected applyOwnAttribute(name: string, value: string): boolean {
    if (name === 'cx') { this.cxValue = this.parseNumber(name, value); return true; }
    if (name === 'cy') { this.cyValue = this.parseNumber(name, value); return true; }
    if (name === 'r') { this.radiusValue = this.parseNonNegativeNumber(name, value); return true; }
    return false;
  }
}