import "dotenv/config";

import { QdrantClient } from "@qdrant/js-client-rest";
import { QdrantVectorStore } from "@langchain/qdrant";

import { embeddings } from "./embeddings";

const collectionName = process.env.QDRANT_COLLECTION || "researchos_documents";

const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";

const qdrantClient = new QdrantClient({
    url: qdrantUrl,
});

export async function initializeVectorStore() {
    const collections = await qdrantClient.getCollections();

    const exists = collections.collections.some((collection) => collection.name === collectionName);

    if (!exists) {
        const vectorSize = await embeddings.embedQuery("ResearchOS embedding dimension test");

        await qdrantClient.createCollection(collectionName, {
            vectors: {
                size: vectorSize.length,
                distance: "Cosine",
            }
        });

    }

    console.log("Qdrant collection ready: ", collectionName);

}

export async function getVectorStore() {
    return QdrantVectorStore.fromExistingCollection(embeddings, {
        url: qdrantUrl,
        collectionName,
    });
}