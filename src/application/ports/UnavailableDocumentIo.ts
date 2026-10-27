import type { Document } from '../../domain/Document.ts';
import type { DocumentIo, DocumentReadResult } from './DocumentIo.ts';

export class UnavailableDocumentIo implements DocumentIo {
  read(_path: string): DocumentReadResult {
    throw new Error('document IO is not configured');
  }

  save(_path: string, _document: Document): void {
    throw new Error('document IO is not configured');
  }
}