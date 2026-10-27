import assert from 'node:assert/strict';
import { PassThrough, Readable } from 'node:stream';
import { describe, test } from 'node:test';
import { createDefaultCommandDispatcher } from '../src/application/dispatch/defaultCommands.ts';
import { EditorSession } from '../src/application/EditorSession.ts';
import { Repl } from '../src/cli/Repl.ts';

describe('REPL integration', () => {
  test('executes commands, prints errors and continues processing', async () => {
    const session = new EditorSession();
    const dispatcher = createDefaultCommandDispatcher(session);
    const input = Readable.from([
      'move r1 1 1\n',
      'init 100 50\n',
      'create rect r1 0 0 10 10 red\n',
      'move r1 5 5\n',
      'undo\n',
      '# comment line\n',
      'help\n',
      'exit\n',
    ]);
    const output = new PassThrough();
    let text = '';
    output.setEncoding('utf8');
    output.on('data', (chunk: string) => { text += chunk; });

    await new Repl(dispatcher, { input, output }).run();

    assert.match(text, /svg-editor 0\.1/);
    assert.match(text, /error: no document\. use 'init' or 'read' first/);
    assert.match(text, /canvas 100x50 created/);
    assert.match(text, /rect#r1 created/);
    assert.match(text, /rect#r1 moved to \(5,5\)/);
    assert.match(text, /rect#r1 moved back to \(0,0\)/);
    assert.match(text, /commands:/);
    assert.match(text, /svg> /);
  });
});