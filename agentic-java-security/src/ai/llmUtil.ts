// src/ai/llmUtil.ts

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function callGPT(messages: any[]): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",         // or "gpt-4o-mini" if you want cheaper cost
    temperature: 0.2,
    messages,
  });
  return response.choices[0].message.content || "";
}

