import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, describe, test } from 'node:test';
import type { CommandDispatcher } from '../src/application/dispatch/CommandDispatcher.ts';
import { createDefaultCommandDispatcher } from '../src/application/dispatch/defaultCommands.ts';
import { EditorSession } from '../src/application/EditorSession.ts';
import { ReadFileError } from '../src/application/errors/ReadFileError.ts';
import { UndoNotAllowedError } from '../src/application/errors/UndoNotAllowedError.ts';
import { TextShape } from '../src/domain/shapes/TextShape.ts';
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
  const directory = mkdtempSync(join(tmpdir(), 'handle-svg-read-'));
  temporaryDirectories.push(directory);
  return directory;
}

after(() => {
  for (const directory of temporaryDirectories) rmSync(directory, { recursive: true, force: true });
});

describe('phase 5 SVG reading', () => {
  test('reads external SVG, assigns missing ids and reports warnings', () => {
    const context = setup();
    const output = run(context, `read ${quotedPath(fixturePath)}`);

    assert.deepEqual(output, [
      'warning: assigned id rect1 to unnamed <rect>',
      `read ${fixturePath} (7 elements)`,
    ]);
    assert.equal(context.session.requireDocument().width, 400);
    assert.equal(context.session.requireDocument().height, 300);
    assert.equal(context.session.requireDocument().size, 7);
    assert.deepEqual(
      context.session.requireDocument().getRootShapes().map((shape) => shape.id),
      ['rect1', 't1', 'c1', 'g1', 'e1'],
    );

    const tree = run(context, 'tree');
    assert.ok(tree.some((line) => line.includes('rect#rect1') && line.includes('fill=#ffffff')));
    assert.ok(tree.some((line) => line.includes('g#g1')));

    const text = context.session.requireDocument().getShape('t1');
    assert.ok(text instanceof TextShape);
    assert.equal(text.text, 'imported');
    assert.throws(() => run(context, 'undo'), UndoNotAllowedError);
  });

  test('read failure leaves the current document and history unchanged', () => {
    const context = setup();
    const missingPath = join(temporaryDirectory(), 'missing.svg');
    run(context, 'init 500 400');
    run(context, 'create rect existing 0 0 10 10');
    const before = run(context, 'tree');
    const depth = context.session.undoDepth;

    assert.throws(() => run(context, `read ${quotedPath(missingPath)}`), {
      name: 'ReadFileError',
      message: `cannot read file: ${missingPath}`,
    });
    assert.deepEqual(run(context, 'tree'), before);
    assert.equal(context.session.requireDocument().hasShape('existing'), true);
    assert.equal(context.session.undoDepth, depth);
    assert.equal(context.session.getCurrentPath(), null);
    run(context, 'undo');
    assert.equal(context.session.requireDocument().size, 0);
  });

  test('malformed SVG read does not replace the current document', () => {
    const context = setup();
    const directory = temporaryDirectory();
    const malformedPath = join(directory, 'broken.svg');
    writeFileSync(malformedPath, '<svg><rect id="r1"></svg>', 'utf8');
    run(context, 'init');
    run(context, 'create rect stable 0 0 10 10');
    const before = run(context, 'tree');

    assert.throws(() => run(context, `read ${quotedPath(malformedPath)}`), ReadFileError);
    assert.deepEqual(run(context, 'tree'), before);
    assert.equal(context.session.requireDocument().hasShape('stable'), true);
  });

  test('viewBox is used when canvas width and height are omitted', () => {
    const context = setup();
    const directory = temporaryDirectory();
    const path = join(directory, 'viewbox.svg');
    writeFileSync(path, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect id="r1" x="0" y="0" width="10" height="10"/></svg>', 'utf8');

    run(context, `read ${quotedPath(path)}`);
    assert.equal(context.session.requireDocument().width, 320);
    assert.equal(context.session.requireDocument().height, 240);
  });
});