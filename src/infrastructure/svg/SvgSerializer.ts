import type { Document } from '../../domain/Document.ts';
import { GroupShape } from '../../domain/shapes/GroupShape.ts';
import type { Shape } from '../../domain/shapes/Shape.ts';
import { TextShape } from '../../domain/shapes/TextShape.ts';

export class SvgSerializer {
  serialize(document: Document): string {
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${document.width}" height="${document.height}" viewBox="0 0 ${document.width} ${document.height}">`,
    ];

    for (const shape of document.getRootShapes()) this.writeShape(shape, 1, lines);
    lines.push('</svg>');
    return `${lines.join('\n')}\n`;
  }

  private writeShape(shape: Shape, depth: number, lines: string[]): void {
    const indent = '  '.repeat(depth);
    const attributes = this.formatAttributes(shape);

    if (shape instanceof GroupShape) {
      lines.push(`${indent}<g${attributes}>`);
      for (const child of shape.children) this.writeShape(child, depth + 1, lines);
      lines.push(`${indent}</g>`);
      return;
    }

    if (shape instanceof TextShape) {
      lines.push(`${indent}<text${attributes}>${escapeXmlText(shape.text)}</text>`);
      return;
    }

    lines.push(`${indent}<${shape.kind}${attributes}/>`);
  }

  private formatAttributes(shape: Shape): string {
    const attributes: Array<readonly [string, string]> = [['id', shape.id]];
    for (const [name, value] of Object.entries(shape.getAttributes())) {
      if (name !== 'text') attributes.push([name, value]);
    }
    return attributes.map(([name, value]) => ` ${name}="${escapeXmlAttribute(value)}"`).join('');
  }
}

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/]]>/g, ']]&gt;');
}

function escapeXmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;');
}