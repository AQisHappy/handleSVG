import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import { commandResult } from '../CommandResult.ts';
import { InvalidCommandError } from '../errors/InvalidCommandError.ts';
import { parsePositiveNumber } from './CommandArguments.ts';

export class CanvasCommand implements Command {
  readonly historyPolicy: HistoryPolicy;

  private readonly width: number | undefined;
  private readonly height: number | undefined;

  constructor(width: number | undefined, height: number | undefined) {
    this.width = width;
    this.height = height;
    this.historyPolicy = width === undefined ? 'none' : 'lock';
  }

  static fromArgs(args: readonly string[]): CanvasCommand {
    if (args.length === 0) return new CanvasCommand(undefined, undefined);
    if (args.length !== 2) throw new InvalidCommandError('usage: canvas [w] [h]');
    return new CanvasCommand(
      parsePositiveNumber('width', args[0] ?? ''),
      parsePositiveNumber('height', args[1] ?? ''),
    );
  }

  execute(context: CommandContext): CommandResult {
    const document = context.requireDocument();
    if (this.width === undefined || this.height === undefined) {
      return commandResult(`canvas ${document.width}x${document.height}`);
    }
    document.setCanvasSize(this.width, this.height);
    return commandResult(`canvas resized to ${document.width}x${document.height}`);
  }
}