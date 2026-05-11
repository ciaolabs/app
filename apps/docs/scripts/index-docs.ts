import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { getReadyDb, ensureRagSchema } from "@ciaobang/db";
import { embedText } from "@ciaobang/rag";

const CONTENT_DIR = join(import.meta.dirname, "../content");
const CHUNK_MAX_CHARS = 2000;
const EMBEDDING_BATCH_DELAY_MS = 200;

type DocChunkInput = {
  docId: string;
  title: string;
  content: string;
  chunkIndex: number;
  embedding: number[];
};

function docIdFromPath(filePath: string) {
  const withoutExtension = relative(CONTENT_DIR, filePath)
    .replaceAll("\\", "/")
    .replace(/\.mdx$/, "")
    .replace(/\/index$/, "");

  return withoutExtension.replaceAll("/", ":") || "index";
}

async function listMdxFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        return listMdxFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".mdx") ? [entryPath] : [];
    }),
  );

  return files.flat();
}

function parseFrontmatter(
  raw: string,
  fallbackDocId: string,
): { docId: string; title: string; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { docId: fallbackDocId, title: "Untitled", body: raw };
  }
  const frontmatter = match[1]!;
  const body = match[2]!.trim();
  const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
  const docIdMatch = frontmatter.match(/^docId:\s*(.+)$/m);
  return {
    title: titleMatch?.[1]?.trim() ?? "Untitled",
    docId: docIdMatch?.[1]?.trim() ?? fallbackDocId,
    body,
  };
}

function chunkByHeadings(body: string, docTitle: string): Array<{ title: string; content: string }> {
  const chunks: Array<{ title: string; content: string }> = [];

  // Split on h2 headings
  const sections = body.split(/\n(?=## )/);

  for (const section of sections) {
    const lines = section.trim().split("\n");
    const headingLine = lines[0] ?? "";
    const isHeading = headingLine.startsWith("## ");
    const sectionTitle = isHeading
      ? `${docTitle} - ${headingLine.replace(/^## /, "")}`
      : docTitle;
    const sectionContent = isHeading ? lines.slice(1).join("\n").trim() : section.trim();

    if (!sectionContent) continue;

    if (sectionContent.length <= CHUNK_MAX_CHARS) {
      chunks.push({ title: sectionTitle, content: sectionContent });
    } else {
      // Split oversized sections on h3 headings
      const subSections = sectionContent.split(/\n(?=### )/);
      for (const sub of subSections) {
        const subLines = sub.trim().split("\n");
        const subHeading = subLines[0] ?? "";
        const isSubHeading = subHeading.startsWith("### ");
        const subTitle = isSubHeading
          ? `${sectionTitle} - ${subHeading.replace(/^### /, "")}`
          : sectionTitle;
        const subContent = isSubHeading ? subLines.slice(1).join("\n").trim() : sub.trim();

        if (!subContent) continue;

        if (subContent.length <= CHUNK_MAX_CHARS) {
          chunks.push({ title: subTitle, content: subContent });
        } else {
          // Last resort: split by double newline (paragraphs)
          const paragraphs = subContent.split(/\n\n+/);
          let buffer = "";
          let partIndex = 0;
          for (const para of paragraphs) {
            if (buffer.length + para.length + 2 > CHUNK_MAX_CHARS && buffer) {
              chunks.push({ title: `${subTitle} (part ${++partIndex})`, content: buffer.trim() });
              buffer = para;
            } else {
              buffer = buffer ? `${buffer}\n\n${para}` : para;
            }
          }
          if (buffer.trim()) {
            chunks.push({
              title: partIndex > 0 ? `${subTitle} (part ${++partIndex})` : subTitle,
              content: buffer.trim(),
            });
          }
        }
      }
    }
  }

  return chunks;
}

async function upsertChunks(chunks: DocChunkInput[]): Promise<void> {
  const sql = await getReadyDb();

  for (const chunk of chunks) {
    const vectorLiteral = `[${chunk.embedding.join(",")}]`;
    await sql`
      INSERT INTO research.doc_chunks (id, doc_id, title, content, chunk_index, embedding, metadata)
      VALUES (
        gen_random_uuid(),
        ${chunk.docId},
        ${chunk.title},
        ${chunk.content},
        ${chunk.chunkIndex},
        ${vectorLiteral}::vector,
        '{}'::jsonb
      )
      ON CONFLICT (doc_id, chunk_index) DO UPDATE
        SET title = EXCLUDED.title,
            content = EXCLUDED.content,
            embedding = EXCLUDED.embedding,
            metadata = EXCLUDED.metadata,
            updated_at = now()
    `;
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    console.error("GOOGLE_API_KEY environment variable is required.");
    process.exit(1);
  }

  await ensureRagSchema();
  console.log("RAG schema ready.");

  const files = await listMdxFiles(CONTENT_DIR);
  console.log(`Found ${files.length} MDX file(s).`);

  for (const file of files) {
    const raw = await readFile(file, "utf-8");
    const { docId, title, body } = parseFrontmatter(raw, docIdFromPath(file));
    const textChunks = chunkByHeadings(body, title);

    console.log(
      `\n[${relative(CONTENT_DIR, file)}] docId="${docId}", ${textChunks.length} chunks`,
    );

    const chunkInputs: DocChunkInput[] = [];
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i]!;
      process.stdout.write(`  Embedding chunk ${i + 1}/${textChunks.length}: "${chunk.title}"... `);
      const embedding = await embedText(chunk.content, googleApiKey);
      process.stdout.write("done\n");
      chunkInputs.push({
        docId,
        title: chunk.title,
        content: chunk.content,
        chunkIndex: i,
        embedding,
      });
      if (i < textChunks.length - 1) {
        await sleep(EMBEDDING_BATCH_DELAY_MS);
      }
    }

    await upsertChunks(chunkInputs);
    console.log(`  Upserted ${chunkInputs.length} chunks for "${docId}".`);
  }

  console.log("\nIndexing complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Indexing failed:", err);
  process.exit(1);
});
