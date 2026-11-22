import { llm } from "../../config/llm";

export async function executeResearchQuery(query: string) {
  const response = await llm.invoke([
    {
      role: "system",
      content: `You are ResearchOS, an intelligent research assistant.
                your responsibilities:
                 - Understand research objectives.
                 - Provide structured responses.
                 - Identify important research areas.
                 - Avoid making unsupported claims.
                 - Clearly identify information that requires verification.
                 
                 For now, You are operating in basic research mode.`,
    },
    {
      role: "user",
      content: query,
    },
  ]);

  return {
    query,
    answer: response.content,
  };
}
