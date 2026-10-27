import { CliError } from './CliError.ts';

export class UnknownShapeTypeError extends CliError {
  constructor(type: string) {
    super(`unknown shape type: ${type} (is the plugin loaded?)`);
  }
}