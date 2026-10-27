import { InvalidArgumentError } from '../errors/InvalidArgumentError.ts';
import { InvalidCommandError } from '../errors/InvalidCommandError.ts';

export function expectArgCount(
  args: readonly string[],
  min: number,
  max: number,
  usage: string,
): void {
  if (args.length < min || args.length > max) {
    throw new InvalidCommandError(`usage: ${usage}`);
  }
}

export function parseNumber(attribute: string, raw: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new InvalidArgumentError(attribute, raw);
  return value;
}

export function parsePositiveNumber(attribute: string, raw: string): number {
  const value = parseNumber(attribute, raw);
  if (value <= 0) throw new InvalidArgumentError(attribute, raw);
  return value;
}