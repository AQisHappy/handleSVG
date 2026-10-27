import { CliError } from './CliError.ts';

export class UndoNotAllowedError extends CliError {
  constructor() {
    super('undo not allowed after io command');
  }
}