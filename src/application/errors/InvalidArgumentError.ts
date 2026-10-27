import { CliError } from './CliError.ts';

export class InvalidArgumentError extends CliError {
  constructor(attribute: string, value: string) {
    super(`invalid value for ${attribute}: ${value}`);
  }
}