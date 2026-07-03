import { source } from "@/lib/source";
import { getLLMText } from "@/lib/get-llm-text";
import { notFound } from "next/navigation";

export const revalidate = false;

// Prerender every doc's markdown at build time so this global content is
// served from the CDN instead of invoking a function per request. The docs
// index page has an empty slug, which a required catch-all can't represent.
export function generateStaticParams() {
  return source.generateParams().filter((param) => param.slug.length > 0);
}

type RouteProps = {
  params: Promise<{ slug: string[] }>;
};

export async function GET(_req: Request, props: RouteProps) {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) {
    notFound();
  }

  const text = await getLLMText(page);
  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
