import { createMemoryChatRepository } from "@/lib/chat/storage.memory";
import { createPostgresChatRepository } from "@/lib/chat/storage.postgres";
import type { ChatRepository } from "@/lib/chat/types";

let repository: ChatRepository | null = null;

export function getChatRepository() {
  if (repository) {
    return repository;
  }

  if (process.env.SURVEY_STORAGE === "memory" || !process.env.DATABASE_URL) {
    repository = createMemoryChatRepository();
    return repository;
  }

  repository = createPostgresChatRepository();
  return repository;
}
