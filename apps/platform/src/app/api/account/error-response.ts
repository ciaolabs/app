import { DatabaseConfigurationError } from "@ciaobang/db";
import { NextResponse } from "next/server";

export function accountStorageErrorResponse(error: unknown) {
  console.error("Account storage operation failed", error);

  const message =
    error instanceof DatabaseConfigurationError
      ? "Database connection is not configured. Set DATABASE_URL or POSTGRES_URL in the deployment environment."
      : "Database connection failed. Check the deployment database environment variables and database availability.";

  return NextResponse.json({ error: message }, { status: 503 });
}
