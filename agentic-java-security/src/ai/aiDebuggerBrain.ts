// src/ai/aiDebuggerBrain.ts

import { callGPT } from "./llmUtil";

export type DebugAction =
  | "continue"
  | "stepOver"
  | "stepInto"
  | "stepOut"
  | "stop"
  | { action: "addBreakpoint"; line: number };

export async function decideNextAction(snapshot: any): Promise<DebugAction> {
  if (!snapshot) return "continue";

  const prompt = `
You are a security-oriented debugging agent.
From the following snapshot JSON, decide the NEXT debugging action to explore deeper potential vulnerabilities.
Use ONLY one of the following EXACT action strings: continue, stepOver, stepInto, stop.

SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}

Respond with ONLY the action string, no explanation.
`;
  const resp = await callGPT([{ role: "user", content: prompt }]);
  const clean = resp.trim();

  if (["stepOver", "stepInto", "stop"].includes(clean)) {
    return clean as any;
  }
  return "continue";
}

