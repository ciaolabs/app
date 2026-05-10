import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

import type { ChatTurnInput } from "@/lib/chat/turn";

/** Narrower input for dev mode: model is ignored so it can be null or any value. */
export type DevChatTurnInput = Omit<ChatTurnInput, "model"> & { model: unknown };

export const runDevChatTurn = async ({ threadId, temporary }: DevChatTurnInput): Promise<Response> => {
  const resolvedThreadId = temporary
    ? null
    : (threadId ?? `dev-thread-${Date.now().toString(36)}`);

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      writer.write({ type: "start" });
      writer.write({ type: "start-step" });

      const recallCallId = "dev-call-recall";
      writer.write({
        type: "tool-input-available",
        toolCallId: recallCallId,
        toolName: "recallSurveyDetail",
        input: { section: "personality.highest_traits" },
      });
      await sleep(450);
      writer.write({
        type: "tool-output-available",
        toolCallId: recallCallId,
        output: {
          section: "personality.highest_traits",
          data: [
            { label: "Openness", score: 78, band: "high", percentileText: "82nd" },
            { label: "Conscientiousness", score: 64, band: "moderate", percentileText: "61st" },
          ],
        },
      });

      const compareCallId = "dev-call-compare";
      writer.write({
        type: "tool-input-available",
        toolCallId: compareCallId,
        toolName: "compareDimensions",
        input: { labels: ["Openness", "Conscientiousness"] },
      });
      await sleep(350);
      writer.write({
        type: "tool-output-available",
        toolCallId: compareCallId,
        output: {
          results: [
            { label: "Openness", found: true, score: 78, band: "high", percentileText: "82nd" },
            { label: "Conscientiousness", found: true, score: 64, band: "moderate", percentileText: "61st" },
          ],
        },
      });

      const textId = "dev-text";
      writer.write({ type: "text-start", id: textId });
      const chunks = [
        "🧪 **Dev mode** — simulated agentic response. ",
        "I called `recallSurveyDetail` to fetch your top traits, then `compareDimensions` to line them up. ",
        "Your **Openness** sits at the high band while **Conscientiousness** is moderate, ",
        "which is a useful tension to reflect on. ",
        "Add an Anthropic or Google API key in [Account Settings](/account) for real responses.",
      ];
      for (const chunk of chunks) {
        writer.write({ type: "text-delta", id: textId, delta: chunk });
        await sleep(70);
      }
      writer.write({ type: "text-end", id: textId });

      writer.write({ type: "finish-step" });
      writer.write({ type: "finish" });
    },
  });

  return createUIMessageStreamResponse({
    stream,
    headers: resolvedThreadId ? { "x-chat-thread-id": resolvedThreadId } : undefined,
  });
};
