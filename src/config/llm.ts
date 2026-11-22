import "dotenv/config";

import { ChatOllama } from "@langchain/ollama";

export const llm = new ChatOllama({
  model: process.env.OLLAMA_MODEL || "qwen3:4b",
  baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  temperature: 0.2,
});

export async function testLLM() {
  const response = await llm.invoke([
    {
      role: "system",
      content: "You are ResearchOS, an AI research assistant.",
    },
    {
      role: "user",
      content: "Introduce yourself in one sentence.",
    },
  ]);

  return response.content;
}
