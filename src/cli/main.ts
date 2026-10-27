import { createDefaultCommandDispatcher } from '../application/dispatch/defaultCommands.ts';
import { EditorSession } from '../application/EditorSession.ts';
import { Repl } from './Repl.ts';

const session = new EditorSession();
const dispatcher = createDefaultCommandDispatcher(session);
const repl = new Repl(dispatcher);
await repl.run();