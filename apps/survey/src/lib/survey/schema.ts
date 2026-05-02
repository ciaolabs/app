import { z } from "zod";

import { getActiveSurveyDefinition } from "@/lib/survey/definitions";
import { isLikertValue } from "@/lib/survey/questions";
import { SurveyAnswers, SurveyType } from "@/lib/survey/types";

export const questionIdSchema = z.string().min(1, "Question id is required.");

export const likertValueSchema = z
  .number()
  .int()
  .refine((value) => isLikertValue(value), { message: "Answer must be between 1 and 6." });

export const answerPayloadSchema = z.object({
  submissionId: z.string().min(1, "Submission id is required.").optional(),
  questionId: questionIdSchema,
  value: likertValueSchema,
});

export const submitPayloadSchema = z.object({
  answers: z.record(z.string(), likertValueSchema),
});

export function validateAnswerMap(surveyType: SurveyType, rawAnswers: Record<string, number>) {
  const definition = getActiveSurveyDefinition(surveyType);

  if (!definition) {
    throw new Error("This survey is not available right now.");
  }

  const entries = Object.entries(rawAnswers);

  if (entries.length !== definition.questionCount) {
    throw new Error(`Expected ${definition.questionCount} answers, received ${entries.length}.`);
  }

  for (const [questionId, value] of entries) {
    if (!definition.questionIds.has(questionId)) {
      throw new Error(`Unexpected question id: ${questionId}`);
    }

    if (!isLikertValue(value)) {
      throw new Error(`Invalid rating for ${questionId}.`);
    }
  }

  return Object.fromEntries(entries) as SurveyAnswers;
}
