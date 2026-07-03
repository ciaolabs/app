import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";

// Static search: the whole Orama index is prerendered at build time and served
// from the CDN as one JSON payload; queries run client-side (see
// docs-search-dialog.tsx). No serverless invocation per keystroke.
export const revalidate = false;

export const { staticGET: GET } = createFromSource(source);
