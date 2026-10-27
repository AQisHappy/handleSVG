import { readFileSync, writeFileSync } from 'node:fs';
import type { Document } from '../../domain/Document.ts';
import type { DocumentIo, DocumentReadResult } from '../../application/ports/DocumentIo.ts';
import { SvgParser } from './SvgParser.ts';
import { SvgSerializer } from './SvgSerializer.ts';

export class SvgDocumentIo implements DocumentIo {
  private readonly parser: SvgParser;
  private readonly serializer: SvgSerializer;

  constructor(parser = new SvgParser(), serializer = new SvgSerializer()) {
    this.parser = parser;
    this.serializer = serializer;
  }

  read(path: string): DocumentReadResult {
    const xml = readFileSync(path, 'utf8');
    return this.parser.parse(xml);
  }

  save(path: string, document: Document): void {
    writeFileSync(path, this.serializer.serialize(document), 'utf8');
  }
}