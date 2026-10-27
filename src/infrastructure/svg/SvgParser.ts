import type { DocumentReadResult } from '../../application/ports/DocumentIo.ts';
import { ShapeFactory } from '../../application/factory/ShapeFactory.ts';
import { Document } from '../../domain/Document.ts';
import { GroupShape } from '../../domain/shapes/GroupShape.ts';
import type { Shape } from '../../domain/shapes/Shape.ts';
import type { XmlElementNode } from './XmlNode.ts';
import { XmlParser } from './XmlParser.ts';

interface ParseState {
  readonly usedIds: Set<string>;
  readonly counters: Map<string, number>;
  readonly warnings: string[];
}

export class SvgParser {
  private readonly xmlParser: XmlParser;
  private readonly shapeFactory: ShapeFactory;

  constructor(xmlParser = new XmlParser(), shapeFactory = new ShapeFactory()) {
    this.xmlParser = xmlParser;
    this.shapeFactory = shapeFactory;
  }

  parse(xml: string): DocumentReadResult {
    const root = this.xmlParser.parse(xml);
    if (root.name !== 'svg') throw new Error('root element must be <svg>');

    const [width, height] = this.readCanvasSize(root);
    const document = new Document(width, height);
    const state: ParseState = {
      usedIds: new Set<string>(),
      counters: new Map<string, number>(),
      warnings: [],
    };

    this.parseChildren(root, document, null, state);
    return { document, warnings: state.warnings };
  }

  private parseChildren(
    parent: XmlElementNode,
    document: Document,
    containerId: string | null,
    state: ParseState,
  ): void {
    for (const child of parent.children) {
      if (child.type !== 'element') continue;
      const shape = this.createShape(child, state);
      document.addShape(shape, containerId ?? undefined);
      if (shape instanceof GroupShape) this.parseChildren(child, document, shape.id, state);
    }
  }

  private createShape(element: XmlElementNode, state: ParseState): Shape {
    const id = this.allocateId(element, state);
    return this.shapeFactory.createFromAttributes(
      element.name,
      id,
      element.attributes,
      this.collectText(element).trim(),
    );
  }

  private allocateId(element: XmlElementNode, state: ParseState): string {
    const explicitId = element.attributes.get('id')?.trim();
    if (explicitId !== undefined && explicitId !== '') {
      if (state.usedIds.has(explicitId)) throw new Error(`duplicate id: ${explicitId}`);
      state.usedIds.add(explicitId);
      return explicitId;
    }

    let counter = (state.counters.get(element.name) ?? 0) + 1;
    let generated = `${element.name}${counter}`;
    while (state.usedIds.has(generated)) {
      counter += 1;
      generated = `${element.name}${counter}`;
    }
    state.counters.set(element.name, counter);
    state.usedIds.add(generated);
    state.warnings.push(`warning: assigned id ${generated} to unnamed <${element.name}>`);
    return generated;
  }

  private number(raw: string | undefined, fallback: number): number {
    if (raw === undefined || raw.trim() === '') return fallback;
    const value = Number(raw);
    if (!Number.isFinite(value)) throw new Error(`invalid numeric SVG attribute: ${raw}`);
    return value;
  }

  private readCanvasSize(root: XmlElementNode): readonly [number, number] {
    const viewBox = root.attributes.get('viewBox')
      ?.trim()
      .split(/[\s,]+/)
      .filter((part) => part !== '')
      .map(Number);
    const viewWidth = viewBox !== undefined && viewBox.length === 4 ? viewBox[2] : undefined;
    const viewHeight = viewBox !== undefined && viewBox.length === 4 ? viewBox[3] : undefined;

    const width = this.positiveDimension(root.attributes.get('width'), viewWidth, 800);
    const height = this.positiveDimension(root.attributes.get('height'), viewHeight, 600);
    return [width, height];
  }

  private positiveDimension(raw: string | undefined, fallback: number | undefined, defaultValue: number): number {
    const candidate = this.number(raw, fallback ?? defaultValue);
    if (candidate <= 0) throw new Error('SVG canvas dimensions must be positive');
    return candidate;
  }

  private collectText(element: XmlElementNode): string {
    let text = '';
    for (const child of element.children) {
      if (child.type === 'text') text += child.value;
      else text += this.collectText(child);
    }
    return text;
  }
}