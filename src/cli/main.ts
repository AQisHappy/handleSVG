import { createDefaultCommandDispatcher } from '../application/dispatch/defaultCommands.ts';
import { EditorSession } from '../application/EditorSession.ts';
import { SvgDocumentIo } from '../infrastructure/svg/SvgDocumentIo.ts';
import { Repl } from './Repl.ts';

const session = new EditorSession();
const dispatcher = createDefaultCommandDispatcher(session, new SvgDocumentIo());
const repl = new Repl(dispatcher);
await repl.run();