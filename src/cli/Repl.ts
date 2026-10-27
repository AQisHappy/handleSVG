import { createInterface } from 'node:readline/promises';
import type { Readable, Writable } from 'node:stream';
import { stdin, stdout } from 'node:process';
import type { CommandDispatcher } from '../application/dispatch/CommandDispatcher.ts';
import { formatError } from './formatError.ts';

export interface ReplOptions {
  readonly input?: Readable;
  readonly output?: Writable;
}

export class Repl {
  private readonly dispatcher: CommandDispatcher;
  private readonly input: Readable;
  private readonly output: Writable;

  constructor(dispatcher: CommandDispatcher, options: ReplOptions = {}) {
    this.dispatcher = dispatcher;
    this.input = options.input ?? stdin;
    this.output = options.output ?? stdout;
  }

  async run(): Promise<void> {
    this.output.write("svg-editor 0.1 — type 'help' for commands\n");
    const readline = createInterface({ input: this.input, output: this.output, prompt: 'svg> ' });

    try {
      readline.prompt();
      for await (const line of readline) {
        if (line.trim() === 'exit' || line.trim() === 'quit') break;

        try {
          const result = this.dispatcher.dispatchLine(line);
          for (const message of result.messages) this.output.write(`${message}\n`);
        } catch (error) {
          this.output.write(`${formatError(error)}\n`);
        }

        if (!this.input.readableEnded) readline.prompt();
      }
    } finally {
      readline.close();
    }
  }
}