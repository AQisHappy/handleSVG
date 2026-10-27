import { Shape } from './Shape.ts';
import type { ShapeKind } from './ShapeKind.ts';

export class TextShape extends Shape {
  private xValue: number;
  private yValue: number;
  private textValue: string;

  constructor(id: string, x: number, y: number, text: string) {
    super(id);
    if (![x, y].every(Number.isFinite)) throw new Error('text geometry must be finite');
    this.xValue = x;
    this.yValue = y;
    this.textValue = text;
  }

  get kind(): ShapeKind { return 'text'; }
  get x(): number { return this.xValue; }
  get y(): number { return this.yValue; }
  get text(): string { return this.textValue; }

  getGeometryAttributes(): Readonly<Record<string, number>> {
    return { x: this.xValue, y: this.yValue };
  }

  getAttribute(name: string): string | undefined {
    return name === 'text' ? this.textValue : super.getAttribute(name);
  }

  getAttributes(): Readonly<Record<string, string>> {
    return { ...super.getAttributes(), text: this.textValue };
  }

  protected moveGeometry(dx: number, dy: number): void { this.xValue += dx; this.yValue += dy; }
  protected scaleGeometry(factor: number): void { this.xValue *= factor; this.yValue *= factor; }

  protected applyOwnAttribute(name: string, value: string): boolean {
    if (name === 'x') { this.xValue = this.parseNumber(name, value); return true; }
    if (name === 'y') { this.yValue = this.parseNumber(name, value); return true; }
    if (name === 'text') { this.textValue = value; return true; }
    return false;
  }
}