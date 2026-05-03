import type { Sql } from "@ciaobang/db";

export type RawChunk = {
  id: string;
  docId: string;
  title: string;
  content: string;
  chunkIndex: number;
  similarity: number;
  embedding: number[];
};

type DbRow = {
  id: string;
  doc_id: string;
  title: string;
  content: string;
  chunk_index: number;
  similarity: number;
  embedding: string;
};

export async function retrieveCandidates(
  queryEmbedding: number[],
  sql: Sql,
  candidateLimit: number = 20,
): Promise<RawChunk[]> {
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;
  const rows = await sql<DbRow[]>`
    SELECT id, doc_id, title, content, chunk_index,
           1 - (embedding <=> ${vectorLiteral}::vector) AS similarity,
           embedding::text AS embedding
    FROM research.doc_chunks
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT ${candidateLimit}
  `;
  return rows.map((row) => ({
    id: row.id,
    docId: row.doc_id,
    title: row.title,
    content: row.content,
    chunkIndex: row.chunk_index,
    similarity: row.similarity,
    embedding: JSON.parse(row.embedding) as number[],
  }));
}
