import type { Command } from '../Command.ts';
import type { CommandHelpEntry } from '../CommandHelpEntry.ts';
import { InvalidOperationError } from '../../domain/errors/InvalidOperationError.ts';
import { UnknownCommandError } from '../errors/UnknownCommandError.ts';

export type CommandFactory = (args: readonly string[]) => Command;

export class CommandRegistry {
  private readonly factories: Map<string, CommandFactory>;
  private readonly entries: CommandHelpEntry[];

  constructor() {
    this.factories = new Map<string, CommandFactory>();
    this.entries = [];
  }

  register(name: string, usage: string, description: string, factory: CommandFactory): void {
    if (this.factories.has(name)) throw new InvalidOperationError(`command already registered: ${name}`);
    this.factories.set(name, factory);
    this.entries.push({ name, usage, description });
  }

  create(name: string, args: readonly string[]): Command {
    const factory = this.factories.get(name);
    if (factory === undefined) throw new UnknownCommandError(name);
    return factory(args);
  }

  describe(): readonly CommandHelpEntry[] {
    return this.entries;
  }
}