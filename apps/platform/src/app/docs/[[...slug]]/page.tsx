import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import {
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";

import { getMDXComponents } from "@/components/mdx";
import { SetAssistPageContent } from "@/components/ai/assist-page-content";
import { getLLMText } from "@/lib/get-llm-text";
import { source } from "@/lib/source";

const GITHUB_REPO = "https://github.com/ciaobang/app";
const CONTENT_PATH = "apps/platform/content/docs";

type PageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

export default async function Page(props: PageProps) {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) {
    notFound();
  }

  const MDX = page.data.body;

  const slugPath = params.slug?.join("/") ?? "";
  const markdownUrl = `/api/markdown/${slugPath}`;
  const githubUrl = `${GITHUB_REPO}/blob/main/${CONTENT_PATH}/${page.path}`;

  // Same text as /api/markdown and llms-full.txt: title + URL + processed
  // markdown, handed to the assist widget so it can answer about this page.
  const pageContent = await getLLMText(page);

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
    >
      <SetAssistPageContent content={pageContent} />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <div className="flex items-center gap-1.5">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={githubUrl}
        />
      </div>
      <hr className="my-4" />
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) {
    notFound();
  }

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
