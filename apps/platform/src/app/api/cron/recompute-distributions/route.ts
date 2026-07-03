import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import {
  REFERENCE_DISTRIBUTIONS_CACHE_TAG,
  recomputeReferenceDistributions,
} from "@/lib/survey/results/reference-distributions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Recomputes per-question response distributions from real submissions so the
// violin plots and gauge medians reflect user input. Scheduled monthly via
// Vercel Cron (see vercel.json), which sends `Authorization: Bearer $CRON_SECRET`.
// Can also be triggered manually with the same header for an ad-hoc refresh.
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const summary = await recomputeReferenceDistributions();
    // Drop the cached read-side copies so violin plots pick up the new bins
    // immediately instead of after the daily revalidate window. ("max" is the
    // Next 16 expiry profile: treat the tagged entries as fully expired.)
    revalidateTag(REFERENCE_DISTRIBUTIONS_CACHE_TAG, "max");
    logger.info(summary, "Reference distributions recomputed");
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    logger.error({ error }, "Reference distribution recompute failed");
    return NextResponse.json({ error: "Unable to recompute reference distributions." }, { status: 500 });
  }
}

export function GET(request: Request) {
  return handle(request);
}

export function POST(request: Request) {
  return handle(request);
}
