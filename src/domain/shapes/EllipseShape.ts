import { Shape } from './Shape.ts';
import type { ShapeKind } from './ShapeKind.ts';

export class EllipseShape extends Shape {
  private cxValue: number;
  private cyValue: number;
  private rxValue: number;
  private ryValue: number;

  constructor(id: string, cx: number, cy: number, rx: number, ry: number) {
    super(id);
    if (![cx, cy, rx, ry].every(Number.isFinite)) throw new Error('ellipse geometry must be finite');
    if (rx < 0 || ry < 0) throw new Error('ellipse radii must not be negative');
    this.cxValue = cx;
    this.cyValue = cy;
    this.rxValue = rx;
    this.ryValue = ry;
  }

  get kind(): ShapeKind { return 'ellipse'; }
  get cx(): number { return this.cxValue; }
  get cy(): number { return this.cyValue; }
  get rx(): number { return this.rxValue; }
  get ry(): number { return this.ryValue; }

  getGeometryAttributes(): Readonly<Record<string, number>> {
    return { cx: this.cxValue, cy: this.cyValue, rx: this.rxValue, ry: this.ryValue };
  }

  protected moveGeometry(dx: number, dy: number): void { this.cxValue += dx; this.cyValue += dy; }
  protected scaleGeometry(factor: number): void {
    this.cxValue *= factor; this.cyValue *= factor; this.rxValue *= factor; this.ryValue *= factor;
  }

  protected applyOwnAttribute(name: string, value: string): boolean {
    if (name === 'cx') { this.cxValue = this.parseNumber(name, value); return true; }
    if (name === 'cy') { this.cyValue = this.parseNumber(name, value); return true; }
    if (name === 'rx') { this.rxValue = this.parseNonNegativeNumber(name, value); return true; }
    if (name === 'ry') { this.ryValue = this.parseNonNegativeNumber(name, value); return true; }
    return false;
  }
}