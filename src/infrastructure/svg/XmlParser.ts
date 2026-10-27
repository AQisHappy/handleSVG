import type { XmlElementNode, XmlNode } from './XmlNode.ts';

export class XmlParser {
  parse(xml: string): XmlElementNode {
    const source = xml.replace(/^\uFEFF/, '');
    const stack: XmlElementNode[] = [];
    let root: XmlElementNode | undefined;
    let index = 0;

    while (index < source.length) {
      if (source[index] !== '<') {
        const nextTag = source.indexOf('<', index);
        const end = nextTag < 0 ? source.length : nextTag;
        const text = decodeXmlEntities(source.slice(index, end));
        this.appendText(stack, text, root !== undefined);
        index = end;
        continue;
      }

      if (source.startsWith('<!--', index)) {
        index = this.skipUntil(source, index + 4, '-->');
        continue;
      }
      if (source.startsWith('<?', index)) {
        index = this.skipUntil(source, index + 2, '?>');
        continue;
      }
      if (source.startsWith('<![CDATA[', index)) {
        const end = source.indexOf(']]>', index + 9);
        if (end < 0) throw new Error('unterminated CDATA');
        this.appendText(stack, source.slice(index + 9, end), root !== undefined);
        index = end + 3;
        continue;
      }
      if (/^<!DOCTYPE/i.test(source.slice(index))) {
        index = this.skipUntil(source, index + 2, '>');
        continue;
      }
      if (source.startsWith('</', index)) {
        const end = source.indexOf('>', index);
        if (end < 0) throw new Error('unterminated closing tag');
        const name = source.slice(index + 2, end).trim();
        const current = stack.pop();
        if (current === undefined || current.name !== name) throw new Error(`mismatched closing tag: ${name}`);
        index = end + 1;
        continue;
      }

      const tagEnd = this.findTagEnd(source, index + 1);
      let tagBody = source.slice(index + 1, tagEnd).trim();
      const selfClosing = tagBody.endsWith('/');
      if (selfClosing) tagBody = tagBody.slice(0, -1).trimEnd();
      const element = this.parseStartTag(tagBody);

      if (stack.length === 0) {
        if (root !== undefined) throw new Error('multiple root elements');
        root = element;
      } else {
        const parent = stack.at(-1);
        if (parent === undefined) throw new Error('invalid XML nesting');
        parent.children.push(element);
      }

      if (!selfClosing) stack.push(element);
      index = tagEnd + 1;
    }

    if (stack.length > 0) throw new Error(`unclosed element: ${stack.at(-1)?.name ?? 'unknown'}`);
    if (root === undefined) throw new Error('missing root element');
    return root;
  }

  private parseStartTag(body: string): XmlElementNode {
    const nameMatch = /^([^\s/>]+)/.exec(body);
    const name = nameMatch?.[1];
    if (name === undefined) throw new Error('invalid start tag');

    const attributes = new Map<string, string>();
    let index = name.length;
    while (index < body.length) {
      while (index < body.length && /\s/.test(body[index] ?? '')) index += 1;
      if (index >= body.length) break;

      const nameEnd = this.scanAttributeName(body, index);
      if (nameEnd === index) throw new Error('invalid attribute name');
      const attributeName = body.slice(index, nameEnd);
      index = nameEnd;
      while (index < body.length && /\s/.test(body[index] ?? '')) index += 1;
      if (body[index] !== '=') throw new Error(`missing value for attribute: ${attributeName}`);
      index += 1;
      while (index < body.length && /\s/.test(body[index] ?? '')) index += 1;

      const quote = body[index];
      if (quote !== '"' && quote !== "'") throw new Error(`unquoted attribute: ${attributeName}`);
      const valueEnd = body.indexOf(quote, index + 1);
      if (valueEnd < 0) throw new Error(`unterminated attribute: ${attributeName}`);
      attributes.set(attributeName, decodeXmlEntities(body.slice(index + 1, valueEnd)));
      index = valueEnd + 1;
    }

    return { type: 'element', name, attributes, children: [] };
  }

  private scanAttributeName(source: string, start: number): number {
    let index = start;
    while (index < source.length) {
      const character = source[index] ?? '';
      if (/\s/.test(character) || character === '=') break;
      index += 1;
    }
    return index;
  }

  private findTagEnd(source: string, start: number): number {
    let quote: string | null = null;
    for (let index = start; index < source.length; index += 1) {
      const character = source[index];
      if (quote !== null) {
        if (character === quote) quote = null;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '>') {
        return index;
      }
    }
    throw new Error('unterminated start tag');
  }

  private skipUntil(source: string, start: number, marker: string): number {
    const end = source.indexOf(marker, start);
    if (end < 0) throw new Error(`missing XML terminator: ${marker}`);
    return end + marker.length;
  }

  private appendText(stack: readonly XmlElementNode[], value: string, rootExists: boolean): void {
    if (value === '' || !rootExists) return;
    const parent = stack.at(-1);
    if (parent === undefined) {
      if (value.trim() !== '') throw new Error('text outside root element');
      return;
    }
    const node: XmlNode = { type: 'text', value };
    parent.children.push(node);
  }
}

export function decodeXmlEntities(value: string): string {
  return value.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|amp|lt|gt|quot|apos);/g, (match, entity: string) => {
    if (entity === 'amp') return '&';
    if (entity === 'lt') return '<';
    if (entity === 'gt') return '>';
    if (entity === 'quot') return '"';
    if (entity === 'apos') return "'";
    if (entity.startsWith('#x')) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith('#')) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return match;
  });
}