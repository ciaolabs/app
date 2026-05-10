import { AUTH_PROVIDER, getReadyDb, type Sql } from "@ciaobang/db";

import { decryptApiKey, encryptApiKey } from "./crypto";
import { DEFAULT_CHAT_MODEL, type ApiKeyProvider } from "./models";

type AccountRow = { id: string; display_name: string | null; organization: string | null };
type ApiKeyRow = { provider: ApiKeyProvider; encrypted_key: string };
type PrefsRow = { chat_model: string };

export async function getOrCreateAccount(userId: string, sql?: Sql): Promise<AccountRow> {
  const db = sql ?? (await getReadyDb());
  const [row] = await db<AccountRow[]>`
    insert into app_private.user_accounts (provider, provider_user_id, last_seen_at)
    values (${AUTH_PROVIDER}, ${userId}, now())
    on conflict (provider, provider_user_id)
    do update set last_seen_at = excluded.last_seen_at
    returning id, display_name, organization
  `;
  if (!row) throw new Error("Unable to get user account");
  return row;
}

export async function updateProfile(
  userId: string,
  displayName: string | null,
  organization: string | null,
  sql?: Sql,
) {
  const db = sql ?? (await getReadyDb());
  const account = await getOrCreateAccount(userId, db);
  await db`
    update app_private.user_accounts
    set display_name = ${displayName}, organization = ${organization}
    where id = ${account.id}
  `;
}

export async function setApiKey(userId: string, provider: ApiKeyProvider, key: string, sql?: Sql) {
  const db = sql ?? (await getReadyDb());
  const account = await getOrCreateAccount(userId, db);
  const encrypted = encryptApiKey(key.trim());
  await db`
    insert into app_private.user_api_keys (user_account_id, provider, encrypted_key)
    values (${account.id}, ${provider}, ${encrypted})
    on conflict (user_account_id, provider)
    do update set encrypted_key = excluded.encrypted_key, updated_at = now()
  `;
}

export async function removeApiKey(userId: string, provider: ApiKeyProvider, sql?: Sql) {
  const db = sql ?? (await getReadyDb());
  const account = await getOrCreateAccount(userId, db);
  await db`
    delete from app_private.user_api_keys
    where user_account_id = ${account.id} and provider = ${provider}
  `;
}

export async function getApiKeyProviders(
  userId: string,
  sql?: Sql,
): Promise<Record<ApiKeyProvider, boolean>> {
  const db = sql ?? (await getReadyDb());
  const account = await getOrCreateAccount(userId, db);
  const rows = await db<{ provider: ApiKeyProvider }[]>`
    select provider from app_private.user_api_keys where user_account_id = ${account.id}
  `;
  const set = new Set(rows.map((r) => r.provider));
  return { anthropic: set.has("anthropic"), google: set.has("google") };
}

export async function getDecryptedApiKey(
  userId: string,
  provider: ApiKeyProvider,
  sql?: Sql,
): Promise<string | null> {
  const db = sql ?? (await getReadyDb());
  const account = await getOrCreateAccount(userId, db);
  const [row] = await db<ApiKeyRow[]>`
    select encrypted_key from app_private.user_api_keys
    where user_account_id = ${account.id} and provider = ${provider}
  `;
  if (!row) return null;
  try {
    return decryptApiKey(row.encrypted_key);
  } catch {
    return null;
  }
}

export async function getPreferences(userId: string, sql?: Sql): Promise<{ chatModel: string }> {
  const db = sql ?? (await getReadyDb());
  const account = await getOrCreateAccount(userId, db);
  const [row] = await db<PrefsRow[]>`
    select chat_model from app_private.user_preferences where user_account_id = ${account.id}
  `;
  return { chatModel: row?.chat_model ?? DEFAULT_CHAT_MODEL };
}

export async function updatePreferences(userId: string, chatModel: string, sql?: Sql) {
  const db = sql ?? (await getReadyDb());
  const account = await getOrCreateAccount(userId, db);
  await db`
    insert into app_private.user_preferences (user_account_id, chat_model)
    values (${account.id}, ${chatModel})
    on conflict (user_account_id)
    do update set chat_model = excluded.chat_model, updated_at = now()
  `;
}

export async function deleteAccount(userId: string, sql?: Sql) {
  const db = sql ?? (await getReadyDb());
  await db`
    delete from app_private.user_accounts
    where provider = ${AUTH_PROVIDER} and provider_user_id = ${userId}
  `;
}

export async function hasAnyApiKey(userId: string, sql?: Sql): Promise<boolean> {
  const keys = await getApiKeyProviders(userId, sql);
  return keys.anthropic || keys.google;
}
