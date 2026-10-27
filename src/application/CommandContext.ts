import type { CommandResult } from './CommandResult.ts';
import type { Document } from '../domain/Document.ts';

export interface CommandContext {
  getDocument(): Document | null;
  requireDocument(): Document;
  setDocument(document: Document | null): void;
  undo(): CommandResult;
  redo(): CommandResult;
}