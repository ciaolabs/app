import { describe, expect, it } from "vitest";

import { createMemoryChatRepository } from "@/lib/chat/storage.memory";

describe("createMemoryChatRepository", () => {
  it("scopes threads and messages by user", async () => {
    const repository = createMemoryChatRepository();
    const thread = await repository.createThread({
      userId: "user_a",
      title: "Values chat",
    });

    await repository.appendMessage({
      userId: "user_a",
      threadId: thread.id,
      role: "user",
      content: "What stands out?",
    });

    await expect(repository.getThread("user_b", thread.id)).resolves.toBeNull();
    await expect(
      repository.appendMessage({
        userId: "user_b",
        threadId: thread.id,
        role: "assistant",
        content: "Nope",
      }),
    ).rejects.toThrow("Unable to load the chat thread.");

    const loaded = await repository.getThread("user_a", thread.id);
    expect(loaded?.messages).toHaveLength(1);
    expect(loaded?.messages[0]?.content).toBe("What stands out?");
  });
});
