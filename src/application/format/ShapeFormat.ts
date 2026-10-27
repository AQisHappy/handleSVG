import type { Document } from '../../domain/Document.ts';
import { CircleShape } from '../../domain/shapes/CircleShape.ts';
import { EllipseShape } from '../../domain/shapes/EllipseShape.ts';
import { GroupShape } from '../../domain/shapes/GroupShape.ts';
import { LineShape } from '../../domain/shapes/LineShape.ts';
import { RectShape } from '../../domain/shapes/RectShape.ts';
import type { Shape } from '../../domain/shapes/Shape.ts';
import { TextShape } from '../../domain/shapes/TextShape.ts';

interface TreeEntry {
  readonly prefix: string;
  readonly label: string;
  readonly descriptor: string;
}

export function formatShapeLabel(shape: Shape): string {
  return `${shape.kind}#${shape.id}`;
}

export function formatMoveResult(shape: Shape, dx: number, dy: number, undo = false): string {
  const label = formatShapeLabel(shape);
  if (shape instanceof GroupShape) {
    return `${label} moved ${undo ? 'back ' : ''}by (${dx},${dy})`;
  }

  const destination = `${undo ? 'back to' : 'to'} ${formatPrimaryPosition(shape)}`;
  return `${label} moved ${destination}`;
}

export function formatSetResult(shape: Shape, attribute: string, value: string): string {
  const formattedValue = attribute === 'text' ? JSON.stringify(value) : value;
  return `${formatShapeLabel(shape)} updated: ${attribute}=${formattedValue}`;
}

export function formatRestoredResult(shape: Shape, parentId: string | null): string {
  const location = parentId === null ? 'canvas' : `g#${parentId}`;
  return `${formatShapeLabel(shape)} restored into ${location}`;
}

export function formatTree(document: Document, rootId?: string): readonly string[] {
  const entries: TreeEntry[] = [];

  if (rootId === undefined) {
    for (const [index, shape] of document.getRootShapes().entries()) {
      collectTreeEntries(shape, [], index === document.getRootShapes().length - 1, entries);
    }
    return formatTreeLines(`svg (${document.width}x${document.height})`, entries);
  }

  const root = document.getShape(rootId);
  entries.push({ prefix: '', label: formatShapeLabel(root), descriptor: formatInlineAttributes(root) });
  if (root instanceof GroupShape) {
    for (const [index, child] of root.children.entries()) {
      collectTreeEntries(child, [], index === root.children.length - 1, entries);
    }
  }
  return formatTreeLines(undefined, entries);
}

export function formatShow(shape: Shape): readonly string[] {
  const parent = shape.getParent();
  const lines = [`${formatShapeLabel(shape)}  parent=${parent === null ? 'svg' : formatShapeLabel(parent)}`];

  const geometry = formatShowGeometry(shape);
  if (geometry !== '') lines.push(`  ${geometry}`);

  if (shape instanceof TextShape) lines.push(`  text=${JSON.stringify(shape.text)}`);

  for (const attribute of ['fill', 'stroke', 'stroke-width']) {
    const value = shape.getAttribute(attribute);
    if (value !== undefined) lines.push(`  ${attribute}=${value}`);
  }

  return lines;
}

function collectTreeEntries(
  shape: Shape,
  ancestorLast: readonly boolean[],
  isLast: boolean,
  entries: TreeEntry[],
): void {
  const prefix = ancestorLast.map((last) => (last ? '    ' : '│   ')).join('') + (isLast ? '└── ' : '├── ');
  entries.push({ prefix, label: formatShapeLabel(shape), descriptor: formatInlineAttributes(shape) });

  if (shape instanceof GroupShape) {
    for (const [index, child] of shape.children.entries()) {
      collectTreeEntries(child, [...ancestorLast, isLast], index === shape.children.length - 1, entries);
    }
  }
}

function formatTreeLines(rootLine: string | undefined, entries: readonly TreeEntry[]): readonly string[] {
  const labelWidth = Math.max(0, ...entries.map((entry) => entry.label.length));
  const lines = entries.map((entry) => {
    if (entry.descriptor === '') return `${entry.prefix}${entry.label}`;
    return `${entry.prefix}${entry.label.padEnd(labelWidth)}  ${entry.descriptor}`;
  });
  return rootLine === undefined ? lines : [rootLine, ...lines];
}

function formatPrimaryPosition(shape: Shape): string {
  if (shape instanceof RectShape || shape instanceof TextShape) return `(${shape.x},${shape.y})`;
  if (shape instanceof CircleShape || shape instanceof EllipseShape) return `(${shape.cx},${shape.cy})`;
  if (shape instanceof LineShape) return `(${shape.x1},${shape.y1}) -> (${shape.x2},${shape.y2})`;
  return '';
}

function formatInlineAttributes(shape: Shape): string {
  const style = formatStyleSuffix(shape);
  if (shape instanceof RectShape) return `x=${shape.x} y=${shape.y} w=${shape.width} h=${shape.height}${style}`;
  if (shape instanceof CircleShape) return `cx=${shape.cx} cy=${shape.cy} r=${shape.r}${style}`;
  if (shape instanceof EllipseShape) return `cx=${shape.cx} cy=${shape.cy} rx=${shape.rx} ry=${shape.ry}${style}`;
  if (shape instanceof LineShape) return `(${shape.x1},${shape.y1}) -> (${shape.x2},${shape.y2})${style}`;
  if (shape instanceof TextShape) return `(${shape.x},${shape.y}) ${JSON.stringify(shape.text)}${style}`;
  return style.trimStart();
}

function formatShowGeometry(shape: Shape): string {
  if (shape instanceof RectShape) return `x=${shape.x} y=${shape.y} width=${shape.width} height=${shape.height}`;
  if (shape instanceof CircleShape) return `cx=${shape.cx} cy=${shape.cy} r=${shape.r}`;
  if (shape instanceof EllipseShape) return `cx=${shape.cx} cy=${shape.cy} rx=${shape.rx} ry=${shape.ry}`;
  if (shape instanceof LineShape) return `x1=${shape.x1} y1=${shape.y1} x2=${shape.x2} y2=${shape.y2}`;
  if (shape instanceof TextShape) return `x=${shape.x} y=${shape.y}`;
  return '';
}

function formatStyleSuffix(shape: Shape): string {
  const parts: string[] = [];
  for (const attribute of ['fill', 'stroke', 'stroke-width']) {
    const value = shape.getAttribute(attribute);
    if (value !== undefined) parts.push(`${attribute}=${value}`);
  }
  return parts.length === 0 ? '' : ` ${parts.join(' ')}`;
}