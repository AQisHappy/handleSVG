export interface CommandResult {
  readonly messages: readonly string[];
}

export function commandResult(...messages: string[]): CommandResult {
  return { messages };
}

export const EMPTY_RESULT: CommandResult = { messages: [] };