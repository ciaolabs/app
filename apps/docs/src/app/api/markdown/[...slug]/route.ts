import { source } from "@/lib/source";
import { getLLMText } from "@/lib/get-llm-text";
import { notFound } from "next/navigation";

export const revalidate = false;

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
