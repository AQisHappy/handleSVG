import { CliError } from './CliError.ts';

export class WriteFileError extends CliError {
  constructor(path: string) {
    super(`cannot write file: ${path}`);
  }
}