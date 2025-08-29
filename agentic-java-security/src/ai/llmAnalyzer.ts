// src/ai/llmAnalyzer.ts

import OpenAI from "openai";
import { Snapshot, AnalysisResult } from "../storage/stateManager";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TAXONOMY = [
  "SQL Injection",
  "Command Injection",
  "Path Traversal",
  "Hardcoded Secrets",
  "Insecure Cryptography",
  "Insecure Deserialization",
  "XXE",
  "Sensitive Logging",
  "Insecure Randomness",
  "Broken Authentication / Access Control",
  "Insecure File Handling",
  "SSRF",
  "Other",
];

export async function analyzeWithLLM(snapshot: Snapshot): Promise<AnalysisResult> {
  try {
    console.log("[AI Analyzer] Sending snapshot to LLM...");

    const prompt = `
You are a seasoned application security reviewer analyzing a live Java debug snapshot.

Your task:
1) Decide if this specific state is "safe", "unsafe", or "unknown".
2) If unsafe, pick a category from: [${TAXONOMY.join(", ")}].
3) Explain briefly why (reference concrete implementation details such as string concat into SQL, use of Runtime.exec with untrusted input, MD5/ECB, ObjectInputStream on untrusted data, File path using user input without normalization, etc.).
`;

    // JSON Schema response format
    const schema = {
      name: "analysis_schema",
      schema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["safe", "unsafe", "unknown"],
          },
          category: {
            type: "string",
            enum: [...TAXONOMY],
          },
          reasoning: {
            type: "string",
            description: "Max 2 short sentences explaining the reasoning",
          },
        },
        required: ["status", "category", "reasoning"],
        additionalProperties: false,
      },
    };

    const completion = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: "You are an expert application security auditor." },
        { role: "user", content: prompt },
        { role: "user", content: JSON.stringify(snapshot, null, 2) },
      ],
      response_format: { type: "json_schema", json_schema: schema },
    });

    const raw = completion.choices[0].message?.content;
    if (!raw) throw new Error("Empty response from LLM");

    const parsed = JSON.parse(raw) as AnalysisResult;

    console.log("[AI Analyzer] Result:", parsed);

    return parsed;
  } catch (err: any) {
    console.error("[AI Analyzer] Error:", err);
    return {
      status: "unknown",
      category: "Other",
      reasoning: `Could not analyze: ${err?.message ?? String(err)}`,
    };
  }
}

