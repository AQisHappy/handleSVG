import { CliError } from './CliError.ts';

export class NoDocumentError extends CliError {
  constructor() {
    super("no document. use 'init' or 'read' first");
  }
}