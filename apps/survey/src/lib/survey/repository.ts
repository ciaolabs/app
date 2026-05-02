import { createMemorySurveyRepository } from "@/lib/survey/storage.memory";
import { createPostgresSurveyRepository } from "@/lib/survey/storage.postgres";
import { SurveyRepository } from "@/lib/survey/types";

let repository: SurveyRepository | null = null;

export function getSurveyRepository() {
  if (repository) {
    return repository;
  }

  if (process.env.SURVEY_STORAGE === "memory" || !process.env.DATABASE_URL) {
    repository = createMemorySurveyRepository();
    return repository;
  }

  repository = createPostgresSurveyRepository();
  return repository;
}
