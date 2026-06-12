export type AssistRequestBody = {
  model: string;
  provider: string;
  pageContent?: string;
};

/**
 * Builds the POST body for `/api/assist`. `pageContent` is included only when
 * it has non-whitespace content, so the survey section (which sets none) sends
 * just `model` + `provider` — matching the optional `pageContent` contract the
 * route accepts (see CONTEXT.md, ADR-0002).
 */
export function buildAssistBody(params: {
  model: string;
  provider: string;
  pageContent?: string;
}): AssistRequestBody {
  const { model, provider, pageContent } = params;
  if (pageContent && pageContent.trim().length > 0) {
    return { model, provider, pageContent };
  }
  return { model, provider };
}
