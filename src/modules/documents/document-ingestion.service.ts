import mongoose from "mongoose";

import { ResearchProject } from "../projects/models/research-project.model";
import { ResearchDocument } from "./models/research-document.model";

import { extractDocument } from "./document-extractor.service";

import { chunkDocument } from "./document-chunker.service";

import { getVectorStore } from "../../config/vector-store";

interface IngestDocumentInput {
  projectId: string;
  filename: string;
  mimeType: string;
  size: number;
  storagePath: string;
}

export async function ingestDocument(input: IngestDocumentInput) {
  const { projectId, filename, mimeType, size, storagePath } = input;

  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error("Invalid project ID");
  }

  const project = await ResearchProject.findOne({
    _id: projectId,
    ownerId: "local-user",
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const document = await ResearchDocument.create({
    projectId: project._id,
    filename,
    mimeType,
    size,
    storagePath,
    status: "processing",
  });

  try {
    // Step 1: Extract text
    const pages = await extractDocument(storagePath, mimeType);

    if (!pages.some((page) => page.pageContent.trim())) {
      throw new Error("No readable text found");
    }

    // Step 2: Create chunks
    const chunks = await chunkDocument(pages, {
      projectId: projectId,
      documentId: document._id.toString(),
      filename,
    });

    if (!chunks.length) {
      throw new Error("Document produced no chunks");
    }

    // Step 3: Generate embeddings and store in Qdrant
    const vectorStore = await getVectorStore();

    await vectorStore.addDocuments(chunks);

    // Step 4: Update MongoDB metadata
    document.status = "completed";
    document.pageCount = pages.length;
    document.chunkCount = chunks.length;

    await document.save();

    return document;
  } catch (error) {
    document.status = "failed";
    document.error =
      error instanceof Error ? error.message : "Document ingestion failed";

    await document.save();

    throw error;
  }
}
