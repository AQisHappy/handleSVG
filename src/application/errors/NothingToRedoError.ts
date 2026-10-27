import { CliError } from './CliError.ts';

export class NothingToRedoError extends CliError {
  constructor() {
    super('nothing to redo');
  }
}