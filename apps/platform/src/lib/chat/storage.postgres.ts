import { getReadyDb, type Sql } from "@ciaobang/db";

import { redactPii, subjectHash } from "@/lib/chat/anonymize";
import type {
  ChatMessage,
  ChatRepository,
  ChatRole,
  ChatThreadSummary,
} from "@/lib/chat/types";

type ThreadRow = {
  id: string;
  title: string;
  created_at: string | Date;
  updated_at: string | Date;
};

type MessageRow = {
  id: string;
  thread_id: string;
  role: ChatRole;
  content: string;
  created_at: string | Date;
};

function toIsoString(value: string | Date) {
  return typeof value === "string" ? value : value.toISOString();
}

function toThread(row: ThreadRow, userId: string): ChatThreadSummary {
  return {
    id: row.id,
    userId,
    title: row.title,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

function toMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    role: row.role,
    content: row.content,
    createdAt: toIsoString(row.created_at),
  };
}

// Threads are located by the caller's anonymous subject hash, never by an
// identifiable account id — so a stored row cannot be tied back to a person.
async function selectThread(sql: Sql, userId: string, threadId: string) {
  const [thread] = await sql<ThreadRow[]>`
    select ct.id, ct.title, ct.created_at, ct.updated_at
    from app_private.chat_threads ct
    where ct.id = ${threadId}
      and ct.subject_hash = ${subjectHash(userId)}
    limit 1
  `;

  return thread ? toThread(thread, userId) : null;
}

export function createPostgresChatRepository(): ChatRepository {
  return {
    async listThreads(userId) {
      const sql = await getReadyDb();
      const rows = await sql<ThreadRow[]>`
        select id, title, created_at, updated_at
        from app_private.chat_threads
        where subject_hash = ${subjectHash(userId)}
        order by updated_at desc
      `;

      return rows.map((row) => toThread(row, userId));
    },

    async createThread({ userId, title }) {
      const sql = await getReadyDb();
      const [thread] = await sql<ThreadRow[]>`
        insert into app_private.chat_threads (subject_hash, title)
        values (${subjectHash(userId)}, ${redactPii(title)})
        returning id, title, created_at, updated_at
      `;

      if (!thread) {
        throw new Error("Unable to create the chat thread.");
      }

      return toThread(thread, userId);
    },

    async getThread(userId, threadId) {
      const sql = await getReadyDb();
      const thread = await selectThread(sql, userId, threadId);

      if (!thread) {
        return null;
      }

      const messages = await sql<MessageRow[]>`
        select id, thread_id, role, content, created_at
        from app_private.chat_messages
        where thread_id = ${threadId}
        order by created_at asc
      `;

      return {
        ...thread,
        messages: messages.map(toMessage),
      };
    },

    async appendMessage({ userId, threadId, role, content }) {
      const sql = await getReadyDb();
      const thread = await selectThread(sql, userId, threadId);

      if (!thread) {
        throw new Error("Unable to load the chat thread.");
      }

      const [message] = await sql<MessageRow[]>`
        insert into app_private.chat_messages (thread_id, role, content)
        values (${threadId}, ${role}, ${redactPii(content)})
        returning id, thread_id, role, content, created_at
      `;

      await sql`
        update app_private.chat_threads
        set updated_at = now()
        where id = ${threadId}
      `;

      if (!message) {
        throw new Error("Unable to save the chat message.");
      }

      return toMessage(message);
    },

    async renameThread({ userId, threadId, title }) {
      const sql = await getReadyDb();
      const thread = await selectThread(sql, userId, threadId);

      if (!thread) {
        return null;
      }

      const [renamed] = await sql<ThreadRow[]>`
        update app_private.chat_threads
        set title = ${redactPii(title)}, updated_at = now()
        where id = ${threadId}
          and subject_hash = ${subjectHash(userId)}
        returning id, title, created_at, updated_at
      `;

      return renamed ? toThread(renamed, userId) : null;
    },

    async deleteThread({ userId, threadId }) {
      const sql = await getReadyDb();
      const thread = await selectThread(sql, userId, threadId);

      if (!thread) {
        return false;
      }

      await sql`
        delete from app_private.chat_threads
        where id = ${threadId}
          and subject_hash = ${subjectHash(userId)}
      `;

      return true;
    },
  };
}
