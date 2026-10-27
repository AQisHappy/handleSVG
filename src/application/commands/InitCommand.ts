import { Document } from '../../domain/Document.ts';
import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import { commandResult } from '../CommandResult.ts';
import { parsePositiveNumber } from './CommandArguments.ts';
import { InvalidCommandError } from '../errors/InvalidCommandError.ts';

export class InitCommand implements Command {
  readonly historyPolicy: HistoryPolicy = 'reset';

  private readonly width: number;
  private readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  static fromArgs(args: readonly string[]): InitCommand {
    if (args.length !== 0 && args.length !== 2) {
      throw new InvalidCommandError('usage: init [w] [h]');
    }
    if (args.length === 0) return new InitCommand(800, 600);
    const width = parsePositiveNumber('width', args[0] ?? '');
    const height = parsePositiveNumber('height', args[1] ?? '');
    return new InitCommand(width, height);
  }

  execute(context: CommandContext): CommandResult {
    const document = new Document(this.width, this.height);
    context.setDocument(document);
    context.setCurrentPath(null);
    return commandResult(`canvas ${document.width}x${document.height} created`);
  }
}