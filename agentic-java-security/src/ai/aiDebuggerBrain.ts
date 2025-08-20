// src/ai/aiDebuggerBrain.ts

export type DebugAction =
  | "continue"
  | "stepOver"
  | "stepInto"
  | "stepOut"
  | "stop"
  | { action: "addBreakpoint"; line: number };

export async function decideNextAction(snapshot: any): Promise<DebugAction> {
  // For Day-2, do nothing fancy — just resume.
  return "continue";

  // Later (Day-3 onward), you will plug GPT-4o or heuristic here
  // that inspects the snapshot and makes a smarter decision.
}

