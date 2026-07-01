import { redactPii } from "@/lib/chat/anonymize";
import type {
  ChatMessage,
  ChatRepository,
  ChatRole,
  ChatThreadSummary,
  ChatThreadWithMessages,
} from "@/lib/chat/types";

type MemoryChatState = {
  threads: Map<string, ChatThreadSummary>;
  messages: Map<string, ChatMessage[]>;
};

declare global {
  var __ambiMemoryChatState: MemoryChatState | undefined;
}

function getState() {
  if (!globalThis.__ambiMemoryChatState) {
    globalThis.__ambiMemoryChatState = {
      threads: new Map(),
      messages: new Map(),
    };
  }

  return globalThis.__ambiMemoryChatState;
}

function cloneThread(thread: ChatThreadSummary): ChatThreadSummary {
  return { ...thread };
}

function cloneMessage(message: ChatMessage): ChatMessage {
  return { ...message };
}

function createMessage(threadId: string, role: ChatRole, content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    threadId,
    role,
    content: redactPii(content),
    createdAt: new Date().toISOString(),
  };
}

function sortThreads(threads: ChatThreadSummary[]) {
  return threads.sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export function createMemoryChatRepository(): ChatRepository {
  const state = getState();

  return {
    async listThreads(userId) {
      return sortThreads(
        [...state.threads.values()]
          .filter((thread) => thread.userId === userId)
          .map(cloneThread),
      );
    },

    async createThread({ userId, title }) {
      const now = new Date().toISOString();
      const thread: ChatThreadSummary = {
        id: crypto.randomUUID(),
        userId,
        title: redactPii(title),
        createdAt: now,
        updatedAt: now,
      };

      state.threads.set(thread.id, thread);
      state.messages.set(thread.id, []);
      return cloneThread(thread);
    },

    async getThread(userId, threadId) {
      const thread = state.threads.get(threadId);

      if (!thread || thread.userId !== userId) {
        return null;
      }

      return {
        ...cloneThread(thread),
        messages: (state.messages.get(threadId) ?? []).map(cloneMessage),
      } satisfies ChatThreadWithMessages;
    },

    async appendMessage({ userId, threadId, role, content }) {
      const thread = state.threads.get(threadId);

      if (!thread || thread.userId !== userId) {
        throw new Error("Unable to load the chat thread.");
      }

      const message = createMessage(threadId, role, content);
      const messages = state.messages.get(threadId) ?? [];
      state.messages.set(threadId, [...messages, message]);
      state.threads.set(threadId, {
        ...thread,
        updatedAt: message.createdAt,
      });

      return cloneMessage(message);
    },

    async renameThread({ userId, threadId, title }) {
      const thread = state.threads.get(threadId);

      if (!thread || thread.userId !== userId) {
        return null;
      }

      const renamed = {
        ...thread,
        title: redactPii(title),
        updatedAt: new Date().toISOString(),
      };

      state.threads.set(threadId, renamed);
      return cloneThread(renamed);
    },

    async deleteThread({ userId, threadId }) {
      const thread = state.threads.get(threadId);

      if (!thread || thread.userId !== userId) {
        return false;
      }

      state.threads.delete(threadId);
      state.messages.delete(threadId);
      return true;
    },
  };
}
