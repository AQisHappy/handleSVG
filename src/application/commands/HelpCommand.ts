import type { CommandHelpEntry } from '../CommandHelpEntry.ts';
import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import { commandResult } from '../CommandResult.ts';
import { expectArgCount } from './CommandArguments.ts';

export class HelpCommand implements Command {
  readonly historyPolicy: HistoryPolicy = 'none';

  private readonly entries: readonly CommandHelpEntry[];

  constructor(entries: readonly CommandHelpEntry[]) { this.entries = entries; }

  static fromArgs(args: readonly string[], entries: readonly CommandHelpEntry[]): HelpCommand {
    expectArgCount(args, 0, 0, 'help');
    return new HelpCommand(entries);
  }

  execute(_context: CommandContext): CommandResult {
    const lines = ['commands:'];
    for (const entry of this.entries) {
      lines.push(`  ${entry.usage.padEnd(38)} ${entry.description}`);
    }
    return commandResult(...lines);
  }
}