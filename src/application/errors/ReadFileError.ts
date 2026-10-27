import { CliError } from './CliError.ts';

export class ReadFileError extends CliError {
  constructor(path: string) {
    super(`cannot read file: ${path}`);
  }
}