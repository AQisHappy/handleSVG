import { CliError } from './CliError.ts';

export class UnknownCommandError extends CliError {
  constructor(command: string) {
    super(`unknown command: ${command}`);
  }
}