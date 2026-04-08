import { z } from "zod";

import { QUESTION_COUNT, QUESTION_IDS, isLikertValue } from "@/lib/survey/questions";
import { SurveyAnswers } from "@/lib/survey/types";

export const questionIdSchema = z.string().refine((value) => QUESTION_IDS.has(value), {
  message: "Unknown AMBI question id.",
});

export const likertValueSchema = z
  .number()
  .int()
  .refine((value) => isLikertValue(value), { message: "Answer must be between 1 and 7." });

export const answerPayloadSchema = z.object({
  questionId: questionIdSchema,
  value: likertValueSchema,
});

export const submitPayloadSchema = z.object({
  answers: z.record(z.string(), likertValueSchema),
});

export function validateAnswerMap(rawAnswers: Record<string, number>) {
  const entries = Object.entries(rawAnswers);

  if (entries.length !== QUESTION_COUNT) {
    throw new Error(`Expected ${QUESTION_COUNT} answers, received ${entries.length}.`);
  }

  for (const [questionId, value] of entries) {
    if (!QUESTION_IDS.has(questionId)) {
      throw new Error(`Unexpected question id: ${questionId}`);
    }

    if (!isLikertValue(value)) {
      throw new Error(`Invalid rating for ${questionId}.`);
    }
  }

  return Object.fromEntries(entries) as SurveyAnswers;
}
