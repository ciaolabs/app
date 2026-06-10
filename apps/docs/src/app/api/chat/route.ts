import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  formatSurveyChatContext,
  getSurveyContextAvailability,
  surveyContextHasResults,
} from "@ciaobang/chat-context";
import { getCurrentUserId } from "@ciaobang/auth";
import { getModelOption, MODEL_OPTIONS } from "@/lib/ai-models";
import { loadSurveyChatContext } from "@/lib/survey-context.server";

function createModel(modelValue: string, apiKey: string) {
  const option = getModelOption(modelValue);
  if (option.provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey });
    return anthropic(option.value);
  }
  const google = createGoogleGenerativeAI({ apiKey });
  return google(option.value);
}

function buildSystemPrompt(
  surveyContextSection: string | null,
  pageContent?: string,
) {
  const base = `You are an AI assistant for Ciao Docs, the documentation site for the Ciao personality assessment platform.
You help users understand personality traits, values, beliefs, and psychological assessment concepts.
Be concise, accurate, and reference the page content when possible.
If you don't know something, say so rather than guessing.`;

  const surveySection = surveyContextSection
    ? `\n\nThe user has completed surveys. Their results are provided below as a compact JSON snapshot. When relevant, personalise your explanations using this data.\n\n${surveyContextSection}`
    : "";

  const pageSection = pageContent
    ? `\n\nThe user is currently reading the following documentation page. Use it as context to answer their questions:\n\n<page-content>\n${pageContent}\n</page-content>`
    : "";

  return `${base}${surveySection}${pageSection}`;
}

type ChatRequestBody = {
  messages?: UIMessage[];
  model?: string;
  provider?: string;
  pageContent?: string;
};

export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  const { messages, model: modelValue, provider, pageContent } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("Messages are required", { status: 400 });
  }

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

  // Try to identify the user: cookie session takes priority, HMAC as fallback.
  // getCurrentUserId never throws — returns null for anonymous visitors.
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request }).catch(() => null);

  const surveyContext = await loadSurveyChatContext({ request, userId: userId ?? undefined });
  const surveyContextSection = surveyContextHasResults(surveyContext)
    ? `Data availability: ${getSurveyContextAvailability(surveyContext)}\n\n${formatSurveyChatContext(surveyContext)}`
    : null;

  const languageModel = createModel(validModel.value, apiKey);

  const result = streamText({
    model: languageModel,
    system: buildSystemPrompt(surveyContextSection, pageContent),
    messages: await convertToModelMessages(messages),
    temperature: 0.6,
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.error("Docs chat stream failed", error);
      return "Something went wrong generating a response. Please try again.";
    },
  });
}
