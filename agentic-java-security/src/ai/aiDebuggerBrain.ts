// src/ai/aiDebuggerBrain.ts

import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const DEBUG_ACTIONS = [
  "continue",
  "stepOver",
  "stepInto",
  "stepOut",
  "stop",
  "addBreakpoint",
] as const;

export type DebugAction =
  | Exclude<typeof DEBUG_ACTIONS[number], "addBreakpoint">
  | { action: "addBreakpoint"; line: number };

export async function decideNextAction(snapshot: any): Promise<DebugAction> {
  if (!snapshot) return "continue";

  // Prompt
  const prompt = `
You are a security-oriented debugging agent.
From the following snapshot JSON, decide the NEXT debugging action
to explore deeper potential vulnerabilities.
`;

  // JSON Schema response format
  const schema = {
    name: "debug_action_schema",
    schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: DEBUG_ACTIONS,
        },
        line: {
          type: "number",
          description: "Required if action = addBreakpoint",
        },
      },
      required: ["action"],
      additionalProperties: false,
    },
  };

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: "You are a security-oriented debugging agent." },
        { role: "user", content: prompt },
        { role: "user", content: JSON.stringify(snapshot, null, 2) },
      ],
      response_format: { type: "json_schema", json_schema: schema },
    });

    const raw = completion.choices[0].message?.content;
    if (!raw) throw new Error("Empty response from LLM");

    const parsed = JSON.parse(raw);

    if (parsed.action === "addBreakpoint") {
      return { action: "addBreakpoint", line: parsed.line };
    }
    return parsed.action;
  } catch (err: any) {
    console.error("[AIDebuggerBrain] Error:", err);
    return "continue";
  }
}

