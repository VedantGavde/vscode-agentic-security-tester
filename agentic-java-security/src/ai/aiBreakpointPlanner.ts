// src/ai/aiBreakpointPlanner.ts

import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function planBreakpoints(
  ast: any
): Promise<Array<{ line: number; reason: string }>> {
  try {
    console.log("[AI Planner] Sending full AST to LLM...");

    const prompt = `
You are a senior Java security auditor. You will receive the full AST of a Java source file.

Your task:
1. Analyze the AST carefully.
2. Identify *lines of code* where inserting breakpoints during debugging could reveal unsafe or insecure conditions.
3. Think beyond known categories. If you see novel or surprising risky behavior, include it.
4. Return only JSON matching the schema below.
`;

    // Schema must be an object at the root
    const schema = {
      name: "breakpoints_schema",
      schema: {
        type: "object",
        properties: {
          breakpoints: {
            type: "array",
            items: {
              type: "object",
              properties: {
                line: { type: "integer" },
                reason: { type: "string" }
              },
              required: ["line", "reason"],
              additionalProperties: false
            }
          }
        },
        required: ["breakpoints"],
        additionalProperties: false
      }
    };

    const completion = await client.chat.completions.create({
      model: "gpt-5-mini", //200,000 TPM limit
      messages: [
        { role: "system", content: "You are an expert security-focused code reviewer." },
        { role: "user", content: prompt },
        { role: "user", content: JSON.stringify(ast) }
      ],
      response_format: { type: "json_schema", json_schema: schema }
    });

    const raw = completion.choices[0].message?.content;
    if (!raw) throw new Error("Empty response from LLM");

    const parsed = JSON.parse(raw) as { breakpoints: Array<{ line: number; reason: string }> };

    console.log("[AI Planner] Planned breakpoints:", parsed.breakpoints);

    

    return parsed.breakpoints;
  } catch (err) {
    console.error("[AI Planner] Error:", err);
    return [];
  }
}

