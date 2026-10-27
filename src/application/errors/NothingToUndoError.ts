import { CliError } from './CliError.ts';

export class NothingToUndoError extends CliError {
  constructor() {
    super('nothing to undo');
  }
}