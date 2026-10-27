import type { CommandResult } from '../CommandResult.ts';
import type { EditorSession } from '../EditorSession.ts';
import { commandResult } from '../CommandResult.ts';
import { parseCommandLine } from '../parsing/CommandLineParser.ts';
import { CommandRegistry } from './CommandRegistry.ts';

export class CommandDispatcher {
  private readonly registry: CommandRegistry;
  private readonly session: EditorSession;

  constructor(registry: CommandRegistry, session: EditorSession) {
    this.registry = registry;
    this.session = session;
  }

  dispatchLine(line: string): CommandResult {
    const parsed = parseCommandLine(line);
    if (parsed === null) return commandResult();
    const command = this.registry.create(parsed.name, parsed.args);
    return this.session.execute(command);
  }
}