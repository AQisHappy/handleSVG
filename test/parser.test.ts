import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { InvalidCommandError } from '../src/application/errors/InvalidCommandError.ts';
import { parseCommandLine, tokenizeCommandLine } from '../src/application/parsing/CommandLineParser.ts';

describe('command line parser', () => {
  test('splits whitespace and preserves quoted arguments with spaces', () => {
    assert.deepEqual(
      tokenizeCommandLine('create text title 20 40 "My Diagram"'),
      ['create', 'text', 'title', '20', '40', 'My Diagram'],
    );
  });

  test('supports escaped quotes and backslashes inside quoted values', () => {
    assert.deepEqual(
      tokenizeCommandLine('set t1 text "Say \\"hello\\" C:\\\\tmp"'),
      ['set', 't1', 'text', 'Say "hello" C:\\tmp'],
    );
  });

  test('preserves an explicitly empty quoted argument', () => {
    assert.deepEqual(tokenizeCommandLine('set t1 text ""'), ['set', 't1', 'text', '']);
  });

  test('ignores comment-only lines and blank lines', () => {
    assert.deepEqual(tokenizeCommandLine('   # save demo.svg'), []);
    assert.equal(parseCommandLine('   '), null);
  });

  test('does not treat a color token starting with # as a comment', () => {
    assert.deepEqual(
      tokenizeCommandLine('create rect r1 0 0 10 10 #ff0000'),
      ['create', 'rect', 'r1', '0', '0', '10', '10', '#ff0000'],
    );
  });

  test('returns a command name and arguments', () => {
    assert.deepEqual(parseCommandLine('move r1 5 -2'), {
      name: 'move',
      args: ['r1', '5', '-2'],
    });
  });

  test('rejects an unterminated quoted string', () => {
    assert.throws(() => tokenizeCommandLine('create text t1 0 0 "broken'), {
      name: 'InvalidCommandError',
      message: 'unterminated quoted string',
    });
    assert.throws(() => tokenizeCommandLine('set t1 text "broken'), InvalidCommandError);
  });
});