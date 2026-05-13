import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed } from "ai";

export async function embedText(text: string, googleApiKey: string): Promise<number[]> {
  const google = createGoogleGenerativeAI({ apiKey: googleApiKey });
  const { embedding } = await embed({
    model: google.embedding("gemini-embedding-001"),
    providerOptions: {
      google: {
        outputDimensionality: 768,
      },
    },
    value: text,
  });
  return embedding;
}
