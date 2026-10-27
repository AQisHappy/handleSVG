import { Shape } from './Shape.ts';
import type { ShapeKind } from './ShapeKind.ts';

export class RectShape extends Shape {
  private xValue: number;
  private yValue: number;
  private widthValue: number;
  private heightValue: number;

  constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id);
    if (![x, y, width, height].every(Number.isFinite)) throw new Error('rect geometry must be finite');
    if (width < 0 || height < 0) throw new Error('rect width and height must not be negative');
    this.xValue = x;
    this.yValue = y;
    this.widthValue = width;
    this.heightValue = height;
  }

  get kind(): ShapeKind { return 'rect'; }
  get x(): number { return this.xValue; }
  get y(): number { return this.yValue; }
  get width(): number { return this.widthValue; }
  get height(): number { return this.heightValue; }

  getGeometryAttributes(): Readonly<Record<string, number>> {
    return { x: this.xValue, y: this.yValue, width: this.widthValue, height: this.heightValue };
  }

  protected moveGeometry(dx: number, dy: number): void { this.xValue += dx; this.yValue += dy; }
  protected scaleGeometry(factor: number): void {
    this.xValue *= factor; this.yValue *= factor; this.widthValue *= factor; this.heightValue *= factor;
  }

  protected applyOwnAttribute(name: string, value: string): boolean {
    if (name === 'x') { this.xValue = this.parseNumber(name, value); return true; }
    if (name === 'y') { this.yValue = this.parseNumber(name, value); return true; }
    if (name === 'width') { this.widthValue = this.parseNonNegativeNumber(name, value); return true; }
    if (name === 'height') { this.heightValue = this.parseNonNegativeNumber(name, value); return true; }
    return false;
  }
}