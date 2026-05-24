import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText } from "ai";
import { surveyContextHasResults } from "@ciaobang/chat-context";
import { getModelOption, MODEL_OPTIONS } from "@/lib/ai-models";
import { getCurrentUserId } from "@/lib/auth";
import { loadSurveyChatContext } from "@/lib/chat-context-loader";

function createModel(modelValue: string, apiKey: string) {
  const option = getModelOption(modelValue);
  if (option.provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey });
    return anthropic(option.value);
  }
  const google = createGoogleGenerativeAI({ apiKey });
  return google(option.value);
}

function buildSystemPrompt(userContext?: string) {
  const base = `You are Ciao!, the AI assistant for the Ciao personality assessment platform on survey.ciaobang.com.
You help users understand their personality traits, values, beliefs, and survey results.
Be concise, accurate, warm, and reference the user's own results when available.
If you don't know something, say so rather than guessing.`;

  if (!userContext) return base;

  return `${base}

The signed-in user has completed surveys. Use these results as context when answering:

<user-survey-results>
${userContext}
</user-survey-results>`;
}

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

  let userContext: string | undefined;
  try {
    const userId = await getCurrentUserId();
    if (userId) {
      const ctx = await loadSurveyChatContext(userId);
      if (ctx && surveyContextHasResults(ctx)) {
        userContext = JSON.stringify(ctx, null, 2);
      }
    }
  } catch {
    // anon user or context unavailable — fall through with base prompt
  }

  const languageModel = createModel(modelValue, apiKey);

  const result = streamText({
    model: languageModel,
    system: buildSystemPrompt(userContext),
    messages: await convertToModelMessages(messages),
    temperature: 0.6,
  });

  return result.toUIMessageStreamResponse();
}
