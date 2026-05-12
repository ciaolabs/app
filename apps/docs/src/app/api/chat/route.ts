import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText } from "ai";
import { getModelOption, MODEL_OPTIONS } from "@/lib/ai-models";

function createModel(modelValue: string, apiKey: string) {
  const option = getModelOption(modelValue);
  if (option.provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey });
    return anthropic(option.value);
  }
  const google = createGoogleGenerativeAI({ apiKey });
  return google(option.value);
}

function buildSystemPrompt(pageContent?: string) {
  const base = `You are an AI assistant for Ciao Docs, the documentation site for the Ciao personality assessment platform.
You help users understand personality traits, values, beliefs, and psychological assessment concepts.
Be concise, accurate, and reference the page content when possible.
If you don't know something, say so rather than guessing.`;

  if (!pageContent) return base;

  return `${base}

The user is currently reading the following documentation page. Use it as context to answer their questions:

<page-content>
${pageContent}
</page-content>`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { messages, model: modelValue, provider, pageContent } = body;

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

  const result = streamText({
    model: languageModel,
    system: buildSystemPrompt(pageContent),
    messages: await convertToModelMessages(messages),
    temperature: 0.6,
  });

  return result.toUIMessageStreamResponse();
}
