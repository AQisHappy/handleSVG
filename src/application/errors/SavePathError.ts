import { CliError } from './CliError.ts';

export class SavePathError extends CliError {
  constructor() {
    super("save requires a file path");
  }
}