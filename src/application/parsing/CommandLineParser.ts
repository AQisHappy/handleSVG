import { InvalidCommandError } from '../errors/InvalidCommandError.ts';
import type { ParsedCommand } from './ParsedCommand.ts';

export function tokenizeCommandLine(line: string): string[] {
  if (line.trimStart().startsWith('#')) return [];

  const tokens: string[] = [];
  let current = '';
  let tokenStarted = false;
  let inQuote = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === undefined) continue;

    if (inQuote) {
      if (character === '\\') {
        const next = line[index + 1];
        if (next === '"' || next === '\\') {
          current += next;
          index += 1;
        } else {
          current += character;
        }
      } else if (character === '"') {
        inQuote = false;
      } else {
        current += character;
      }
      continue;
    }

    if (character === '"') {
      inQuote = true;
      tokenStarted = true;
    } else if (/\s/.test(character)) {
      if (tokenStarted) {
        tokens.push(current);
        current = '';
        tokenStarted = false;
      }
    } else {
      current += character;
      tokenStarted = true;
    }
  }

  if (inQuote) throw new InvalidCommandError('unterminated quoted string');
  if (tokenStarted) tokens.push(current);
  return tokens;
}

export function parseCommandLine(line: string): ParsedCommand | null {
  const tokens = tokenizeCommandLine(line);
  const name = tokens[0];
  if (name === undefined) return null;
  return { name, args: tokens.slice(1) };
}