export type ChatRole = "user" | "assistant";

export type ChatThreadSummary = {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type ChatThreadWithMessages = ChatThreadSummary & {
  messages: ChatMessage[];
};

export interface ChatRepository {
  listThreads(userId: string): Promise<ChatThreadSummary[]>;
  createThread(params: { userId: string; title: string }): Promise<ChatThreadSummary>;
  getThread(userId: string, threadId: string): Promise<ChatThreadWithMessages | null>;
  appendMessage(params: {
    userId: string;
    threadId: string;
    role: ChatRole;
    content: string;
  }): Promise<ChatMessage>;
  renameThread(params: {
    userId: string;
    threadId: string;
    title: string;
  }): Promise<ChatThreadSummary | null>;
}
