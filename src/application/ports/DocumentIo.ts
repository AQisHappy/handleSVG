import type { Document } from '../../domain/Document.ts';

export interface DocumentReadResult {
  readonly document: Document;
  readonly warnings: readonly string[];
}

export interface DocumentIo {
  read(path: string): DocumentReadResult;
  save(path: string, document: Document): void;
}