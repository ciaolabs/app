import { createMemoryChatRepository } from "@/lib/chat/storage.memory";
import { createPostgresChatRepository } from "@/lib/chat/storage.postgres";
import type { ChatRepository } from "@/lib/chat/types";
import { hasDatabaseUrl } from "@ciaobang/db";

let repository: ChatRepository | null = null;

export function getChatRepository() {
  if (repository) {
    return repository;
  }

  if (process.env.SURVEY_STORAGE === "memory" || !hasDatabaseUrl()) {
    repository = createMemoryChatRepository();
    return repository;
  }

  repository = createPostgresChatRepository();
  return repository;
}
