import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed } from "ai";

export async function embedText(text: string, googleApiKey: string): Promise<number[]> {
  const google = createGoogleGenerativeAI({ apiKey: googleApiKey });
  const { embedding } = await embed({
    model: google.textEmbeddingModel("text-embedding-004"),
    value: text,
  });
  return embedding;
}
