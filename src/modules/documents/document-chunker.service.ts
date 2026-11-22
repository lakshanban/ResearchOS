import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import type { ExtractedPage } from "./document-extractor.service";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 150,
});

export async function chunkDocument(
  pages: ExtractedPage[],
  metadata: { projectId: string; documentId: string; filename: string },
) {
  const documents = pages.map((page) => {
    return new Document({
      pageContent: page.pageContent,
      metadata: {
        ...metadata,
        page: page.page,
      },
    });
  });

  const chunks = await splitter.splitDocuments(documents);

  return chunks.map((chunk, index) => {
    chunk.metadata.chunkIndex = index;
    return chunk;
  });
}
