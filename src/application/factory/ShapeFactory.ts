import { InvalidArgumentError } from '../errors/InvalidArgumentError.ts';
import { InvalidCommandError } from '../errors/InvalidCommandError.ts';
import { UnknownShapeTypeError } from '../errors/UnknownShapeTypeError.ts';
import { CircleShape } from '../../domain/shapes/CircleShape.ts';
import { EllipseShape } from '../../domain/shapes/EllipseShape.ts';
import { GroupShape } from '../../domain/shapes/GroupShape.ts';
import { LineShape } from '../../domain/shapes/LineShape.ts';
import { RectShape } from '../../domain/shapes/RectShape.ts';
import type { Shape } from '../../domain/shapes/Shape.ts';
import { TextShape } from '../../domain/shapes/TextShape.ts';

export class ShapeFactory {
  create(type: string, id: string, params: readonly string[]): Shape {
    switch (type) {
      case 'rect': {
        this.expectParameterCount(type, params, 4, 5);
        const shape = new RectShape(
          id,
          this.number('x', params, 0),
          this.number('y', params, 1),
          this.nonNegative('width', params, 2),
          this.nonNegative('height', params, 3),
        );
        this.applyOptionalStyle(shape, 'fill', params[4]);
        return shape;
      }
      case 'circle': {
        this.expectParameterCount(type, params, 3, 4);
        const shape = new CircleShape(
          id,
          this.number('cx', params, 0),
          this.number('cy', params, 1),
          this.nonNegative('r', params, 2),
        );
        this.applyOptionalStyle(shape, 'fill', params[3]);
        return shape;
      }
      case 'ellipse': {
        this.expectParameterCount(type, params, 4, 5);
        const shape = new EllipseShape(
          id,
          this.number('cx', params, 0),
          this.number('cy', params, 1),
          this.nonNegative('rx', params, 2),
          this.nonNegative('ry', params, 3),
        );
        this.applyOptionalStyle(shape, 'fill', params[4]);
        return shape;
      }
      case 'line': {
        this.expectParameterCount(type, params, 4, 5);
        const shape = new LineShape(
          id,
          this.number('x1', params, 0),
          this.number('y1', params, 1),
          this.number('x2', params, 2),
          this.number('y2', params, 3),
        );
        this.applyOptionalStyle(shape, 'stroke', params[4]);
        return shape;
      }
      case 'text': {
        this.expectParameterCount(type, params, 3, 3);
        return new TextShape(
          id,
          this.number('x', params, 0),
          this.number('y', params, 1),
          this.required(params, 2),
        );
      }
      case 'g':
        this.expectParameterCount(type, params, 0, 0);
        return new GroupShape(id);
      default:
        throw new UnknownShapeTypeError(type);
    }
  }

  createFromAttributes(
    type: string,
    id: string,
    attributes: ReadonlyMap<string, string>,
    textContent = '',
  ): Shape {
    const value = (name: string, fallback = '0'): string => attributes.get(name) ?? fallback;
    let params: string[];

    switch (type) {
      case 'rect':
        params = [value('x'), value('y'), value('width'), value('height')];
        break;
      case 'circle':
        params = [value('cx'), value('cy'), value('r')];
        break;
      case 'ellipse':
        params = [value('cx'), value('cy'), value('rx'), value('ry')];
        break;
      case 'line':
        params = [value('x1'), value('y1'), value('x2'), value('y2')];
        break;
      case 'text':
        params = [value('x'), value('y'), textContent];
        break;
      case 'g':
        params = [];
        break;
      default:
        throw new UnknownShapeTypeError(type);
    }

    const shape = this.create(type, id, params);
    for (const name of ['fill', 'stroke', 'stroke-width']) {
      const style = attributes.get(name);
      if (style !== undefined) shape.setAttribute(name, style);
    }
    return shape;
  }

  private expectParameterCount(type: string, params: readonly string[], min: number, max: number): void {
    if (params.length < min || params.length > max) {
      throw new InvalidCommandError(`invalid parameter count for ${type}`);
    }
  }

  private required(params: readonly string[], index: number): string {
    const value = params[index];
    if (value === undefined) throw new InvalidCommandError(`missing parameter at position ${index + 1}`);
    return value;
  }

  private number(attribute: string, params: readonly string[], index: number): number {
    const raw = this.required(params, index);
    const value = Number(raw);
    if (!Number.isFinite(value)) throw new InvalidArgumentError(attribute, raw);
    return value;
  }

  private nonNegative(attribute: string, params: readonly string[], index: number): number {
    const value = this.number(attribute, params, index);
    if (value < 0) throw new InvalidArgumentError(attribute, this.required(params, index));
    return value;
  }

  private applyOptionalStyle(shape: Shape, attribute: string, value: string | undefined): void {
    if (value !== undefined) shape.setAttribute(attribute, value);
  }
}