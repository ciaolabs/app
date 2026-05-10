import type postgres from "postgres";

import { AUTH_PROVIDER, getReadyDb } from "@ciaobang/db";

import type {
  ChatMessage,
  ChatRepository,
  ChatRole,
  ChatThreadSummary,
} from "@/lib/chat/types";

type ThreadRow = {
  id: string;
  provider_user_id: string;
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

type IdRow = {
  id: string;
};

function toIsoString(value: string | Date) {
  return typeof value === "string" ? value : value.toISOString();
}

function toThread(row: ThreadRow): ChatThreadSummary {
  return {
    id: row.id,
    userId: row.provider_user_id,
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

async function ensureUserAccount(sql: postgres.Sql, userId: string) {
  const [account] = await sql<IdRow[]>`
    insert into app_private.user_accounts (provider, provider_user_id, last_seen_at)
    values (${AUTH_PROVIDER}, ${userId}, now())
    on conflict (provider, provider_user_id)
    do update set last_seen_at = excluded.last_seen_at
    returning id
  `;

  if (!account) {
    throw new Error("Unable to load the user account.");
  }

  return account.id;
}

async function selectThread(sql: postgres.Sql, userId: string, threadId: string) {
  const [thread] = await sql<ThreadRow[]>`
    select
      ct.id,
      ua.provider_user_id,
      ct.title,
      ct.created_at,
      ct.updated_at
    from app_private.chat_threads ct
    join app_private.user_accounts ua on ua.id = ct.user_account_id
    where ct.id = ${threadId}
      and ua.provider = ${AUTH_PROVIDER}
      and ua.provider_user_id = ${userId}
    limit 1
  `;

  return thread ? toThread(thread) : null;
}

export function createPostgresChatRepository(): ChatRepository {
  return {
    async listThreads(userId) {
      const sql = await getReadyDb();
      const accountId = await ensureUserAccount(sql, userId);
      const rows = await sql<ThreadRow[]>`
        select
          ct.id,
          ua.provider_user_id,
          ct.title,
          ct.created_at,
          ct.updated_at
        from app_private.chat_threads ct
        join app_private.user_accounts ua on ua.id = ct.user_account_id
        where ct.user_account_id = ${accountId}
        order by ct.updated_at desc
      `;

      return rows.map(toThread);
    },

    async createThread({ userId, title }) {
      const sql = await getReadyDb();
      const accountId = await ensureUserAccount(sql, userId);
      const [thread] = await sql<ThreadRow[]>`
        insert into app_private.chat_threads (user_account_id, title)
        values (${accountId}, ${title})
        returning
          id,
          ${userId} as provider_user_id,
          title,
          created_at,
          updated_at
      `;

      if (!thread) {
        throw new Error("Unable to create the chat thread.");
      }

      return toThread(thread);
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
        values (${threadId}, ${role}, ${content})
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
        set title = ${title}, updated_at = now()
        where id = ${threadId}
        returning
          id,
          ${userId} as provider_user_id,
          title,
          created_at,
          updated_at
      `;

      return renamed ? toThread(renamed) : null;
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
      `;

      return true;
    },
  };
}
