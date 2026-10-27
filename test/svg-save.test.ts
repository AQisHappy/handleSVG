import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, describe, test } from 'node:test';
import type { CommandDispatcher } from '../src/application/dispatch/CommandDispatcher.ts';
import { createDefaultCommandDispatcher } from '../src/application/dispatch/defaultCommands.ts';
import { EditorSession } from '../src/application/EditorSession.ts';
import { SavePathError } from '../src/application/errors/SavePathError.ts';
import { UndoNotAllowedError } from '../src/application/errors/UndoNotAllowedError.ts';
import { WriteFileError } from '../src/application/errors/WriteFileError.ts';
import { SvgDocumentIo } from '../src/infrastructure/svg/SvgDocumentIo.ts';

interface TestContext {
  readonly session: EditorSession;
  readonly dispatcher: CommandDispatcher;
}

const temporaryDirectories: string[] = [];
const fixturePath = resolve('test/fixtures/other.svg');

function setup(): TestContext {
  const session = new EditorSession();
  return { session, dispatcher: createDefaultCommandDispatcher(session, new SvgDocumentIo()) };
}

function run(context: TestContext, line: string): readonly string[] {
  return context.dispatcher.dispatchLine(line).messages;
}

function quotedPath(path: string): string {
  return JSON.stringify(path);
}

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'handle-svg-save-'));
  temporaryDirectories.push(directory);
  return directory;
}

after(() => {
  for (const directory of temporaryDirectories) rmSync(directory, { recursive: true, force: true });
});

describe('phase 5 SVG saving', () => {
  test('saves a document and reads it back with identical structure', () => {
    const context = setup();
    const directory = temporaryDirectory();
    const outputPath = join(directory, 'roundtrip.svg');

    run(context, 'init 640 480');
    run(context, 'create g scene');
    run(context, 'create rect r1 10 20 100 50 #4a90d9 in scene');
    run(context, 'create text t1 20 40 "A & B <C>" in scene');
    run(context, 'create circle c1 200 100 30 red in scene');
    const originalTree = run(context, 'tree');

    assert.deepEqual(run(context, `save ${quotedPath(outputPath)}`), [
      `saved to ${outputPath} (4 elements)`,
    ]);
    assert.throws(() => run(context, 'undo'), UndoNotAllowedError);

    const xml = readFileSync(outputPath, 'utf8');
    assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    assert.match(xml, /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="640" height="480"/);
    assert.match(xml, /<g id="scene">/);
    assert.match(xml, /A &amp; B &lt;C&gt;/);
    assert.match(xml, /viewBox="0 0 640 480"/);

    const restored = setup();
    const readOutput = run(restored, `read ${quotedPath(outputPath)}`);
    assert.equal(readOutput.at(-1), `read ${outputPath} (4 elements)`);
    assert.deepEqual(run(restored, 'tree'), originalTree);
    assert.equal(restored.session.requireDocument().width, 640);
    assert.equal(restored.session.requireDocument().height, 480);
  });

  test('save without a path reuses the read path and explicit save updates it', () => {
    const directory = temporaryDirectory();
    const sourcePath = join(directory, 'source.svg');
    const alternatePath = join(directory, 'alternate.svg');
    copyFileSync(fixturePath, sourcePath);

    const context = setup();
    run(context, `read ${quotedPath(sourcePath)}`);
    run(context, 'create rect added 0 0 1 1');
    assert.deepEqual(run(context, 'save'), [`saved to ${sourcePath} (8 elements)`]);
    assert.match(readFileSync(sourcePath, 'utf8'), /<rect id="added" x="0" y="0" width="1" height="1"\/>/);

    assert.deepEqual(run(context, `save ${quotedPath(alternatePath)}`), [
      `saved to ${alternatePath} (8 elements)`,
    ]);
    assert.equal(context.session.getCurrentPath(), alternatePath);
    assert.equal(existsSync(alternatePath), true);
  });

  test('save failure leaves the document and history unchanged', () => {
    const context = setup();
    const invalidPath = join(temporaryDirectory(), 'missing-directory', 'out.svg');
    run(context, 'init');
    run(context, 'create rect r1 0 0 10 10');
    const depth = context.session.undoDepth;

    assert.throws(() => run(context, `save ${quotedPath(invalidPath)}`), {
      name: 'WriteFileError',
      message: `cannot write file: ${invalidPath}`,
    });
    assert.equal(context.session.requireDocument().hasShape('r1'), true);
    assert.equal(context.session.undoDepth, depth);
    assert.equal(context.session.getCurrentPath(), null);
    run(context, 'undo');
    assert.equal(context.session.requireDocument().hasShape('r1'), false);
  });

  test('save without a read path reports a stable error', () => {
    const context = setup();
    run(context, 'init');
    assert.throws(() => run(context, 'save'), {
      name: 'SavePathError',
      message: 'save requires a file path',
    });
  });
});