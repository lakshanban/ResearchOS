import { getVectorStore } from "../../config/vector-store.js";

export interface RetrievedSource {
  filename: string;
  page: number | null;
  chunkIndex: number;
  content: string;
}

export async function retrieveRelevantDocuments(
  projectId: string,
  query: string,
): Promise<RetrievedSource[]> {
  const vectorStore = await getVectorStore();

  const documents = await vectorStore.similaritySearch(query, 5, {
    must: [
      {
        key: "metadata.projectId",
        match: {
          value: projectId,
        },
      },
    ],
  });

  return documents.map((document) => ({
    filename: String(document.metadata.filename),
    page:
      typeof document.metadata.page === "number"
        ? document.metadata.page
        : null,
    chunkIndex: Number(document.metadata.chunkIndex),
    content: document.pageContent,
  }));
}
