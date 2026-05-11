import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, tool } from "ai";
import { z } from "zod";
import { getModelOption, MODEL_OPTIONS } from "@/lib/ai-models";
import { embedText, retrieveCandidates, mmrRerank } from "@ciaobang/rag";
import { getDb } from "@ciaobang/db";

function createModel(modelValue: string, apiKey: string) {
  const option = getModelOption(modelValue);
  if (option.provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey });
    return anthropic(option.value);
  }
  const google = createGoogleGenerativeAI({ apiKey });
  return google(option.value);
}

function makeDocsSearchTool(googleApiKey: string) {
  return tool({
    description:
      "Search the documentation for explanations of personality traits, values, beliefs, assessment scales, and psychological concepts. Use when the user asks about what something means or how it works.",
    parameters: z.object({
      query: z.string().describe("Search query based on the user's question"),
    }),
    execute: async ({ query }) => {
      const sql = getDb();
      const queryEmbedding = await embedText(query, googleApiKey);
      const candidates = await retrieveCandidates(queryEmbedding, sql);
      const chunks = mmrRerank(candidates, 5);
      return chunks.map((chunk) => ({
        title: chunk.title,
        content: chunk.content,
        relevance: Math.round(chunk.similarity * 100) / 100,
      }));
    },
  });
}

const SYSTEM_PROMPT = `You are an AI assistant for Ciao Docs, the documentation site for the Ciao personality assessment platform.
You help users understand personality traits, values, beliefs, and psychological assessment concepts.
When answering questions, use the searchDocs tool to find relevant documentation content.
Be concise, accurate, and cite the documentation when possible.
If you don't know something, say so rather than guessing.`;

export async function POST(request: Request) {
  const body = await request.json();
  const { messages, model: modelValue, provider } = body;

  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return new Response("Missing API key", { status: 401 });
  }

  const validModel = MODEL_OPTIONS.find((m) => m.value === modelValue);
  if (!validModel) {
    return new Response("Invalid model", { status: 400 });
  }

  if (validModel.provider !== provider) {
    return new Response("Provider mismatch", { status: 400 });
  }

  const languageModel = createModel(modelValue, apiKey);

  const googleApiKey =
    provider === "google"
      ? apiKey
      : request.headers.get("x-google-api-key") ?? undefined;

  const tools: Record<string, ReturnType<typeof tool>> = {};
  if (googleApiKey) {
    tools.searchDocs = makeDocsSearchTool(googleApiKey);
  }

  const result = streamText({
    model: languageModel,
    system: SYSTEM_PROMPT,
    messages,
    tools,
    temperature: 0.6,
    maxSteps: 4,
  });

  return result.toDataStreamResponse();
}
