import { AUTH_PROVIDER, getReadyDb, type Sql } from "@ciaobang/db";

import { normalizeModelId } from "./models";

type AccountRow = { id: string; display_name: string | null; organization: string | null };

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

export async function getPreferences(userId: string, sql?: Sql): Promise<{ chatModel: string }> {
  const db = sql ?? (await getReadyDb());
  // Runs on every chat turn: upsert the account and read its preferences in a
  // single statement — the pool is `max: 1`, so separate queries serialize
  // into back-to-back round trips.
  const [row] = await db<{ chat_model: string | null }[]>`
    with account as (
      insert into app_private.user_accounts (provider, provider_user_id, last_seen_at)
      values (${AUTH_PROVIDER}, ${userId}, now())
      on conflict (provider, provider_user_id)
      do update set last_seen_at = excluded.last_seen_at
      returning id
    )
    select p.chat_model
    from account a
    left join app_private.user_preferences p on p.user_account_id = a.id
  `;
  return { chatModel: normalizeModelId(row?.chat_model) };
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
