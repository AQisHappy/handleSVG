import type { CommandContext } from './CommandContext.ts';
import type { CommandResult } from './CommandResult.ts';
import type { HistoryPolicy } from './HistoryPolicy.ts';

export interface Command {
  readonly historyPolicy: HistoryPolicy;
  execute(context: CommandContext): CommandResult;
  undo?(context: CommandContext): CommandResult;
}