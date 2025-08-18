// src/ai/llmAnalyzer.ts

import { Snapshot, AnalysisResult } from "../storage/stateManager";
import { queryLLM } from "./llmClient";

const MODEL = process.env.OLLAMA_MODEL || "qwen2.5-coder:14b";

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

function truncateCode(code: string, maxLines = 160): string {
  const lines = code.split("\n");
  if (lines.length <= maxLines) return code;
  const head = lines.slice(0, Math.floor(maxLines / 2));
  const tail = lines.slice(-Math.ceil(maxLines / 2));
  return [...head, "// …snip…", ...tail].join("\n");
}

/** Build a single, stable prompt with taxonomy + structured instructions. */
function buildPrompt(snapshot: Snapshot, codeContext: string): string {
  const ctx = {
    file: snapshot.file,
    className: snapshot.className,
    method: snapshot.method?.signature ?? null,
    line: snapshot.line,
    imports: snapshot.imports ?? [],
    args: snapshot.method?.args ?? {},
    locals: snapshot.variables?.Local ?? snapshot.variables ?? {},
  };

  return `You are a seasoned application security reviewer analyzing a live Java debug snapshot.

SNAPSHOT (JSON):
${JSON.stringify(ctx, null, 2)}

CODE CONTEXT (Java, may be truncated):
\`\`\`java
${truncateCode(codeContext)}
\`\`\`

TASK:
1) Decide if this specific state is "safe", "unsafe", or "unknown".
2) If unsafe, pick a category from: [${TAXONOMY.join(", ")}].
3) Explain briefly why (reference concrete implementation details such as string concat into SQL, use of Runtime.exec with untrusted input, MD5/ECB, ObjectInputStream on untrusted data, File path using user input without normalization, etc.).
4) Respond with STRICT JSON only, NO CODE FENCES, with keys:
{
  "status": "safe" | "unsafe" | "unknown",
  "category": "One category from the list above (or \\"Other\\")",
  "reasoning": "Max 2 short sentences"
}`;
}

/** Extract first JSON object from a possibly messy model output. */
function extractFirstJsonObject(text: string): any {
  // Remove optional code fences
  let cleaned = text.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/i, "").trim();
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`No JSON object in LLM output: ${text}`);
  return JSON.parse(m[0]);
}

export async function analyzeWithLLM(snapshot: Snapshot, codeContext: string): Promise<AnalysisResult> {
  const prompt = buildPrompt(snapshot, codeContext);
  const resp = await queryLLM(MODEL, prompt);

  try {
    const parsed = extractFirstJsonObject(resp.output);
    return {
      status: parsed.status ?? "unknown",
      category: parsed.category ?? "Other",
      reasoning: parsed.reasoning ?? "No reasoning provided.",
    };
  } catch (e: any) {
    return {
      status: "unknown",
      category: "Other",
      reasoning: `Could not parse LLM response: ${e?.message ?? String(e)} | raw=${resp.output}`,
    };
  }
}

