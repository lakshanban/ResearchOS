import "dotenv/config";

import { z } from "zod";

const SearxResultSchema = z
  .object({
    title: z.string().optional(),
    url: z.string().optional(),
    content: z.string().optional(),
    engine: z.string().optional(),
    score: z.number().optional(),
    category: z.string().optional(),
    publishedDate: z.string().nullable().optional(),
  })
  .passthrough();

const SearxResponseSchema = z.object({
  query: z.string().optional(),
  number_of_results: z.number().optional(),
  results: z.array(SearxResultSchema),
});

export interface ResearchSearchResult {
  title: string;
  url: string;
  description: string;
  engine?: string;
  score?: number;
  category?: string;
  publishedAt?: string;
  domain: string;
}

export interface ResearchSearchResponse {
  query: string;
  totalResults: number;
  results: ResearchSearchResult[];
}

export interface ResearchSearchOptions {
  limit?: number;
  language?: string;
  categories?: string[];
}

const SEARXNG_BASE_URL = (
  process.env.SEARXNG_BASE_URL || "http://localhost:8888"
).replace(/\/+$/, "");

const SEARXNG_TIMEOUT_MS = Number(process.env.SEARXNG_TIMEOUT_MS || 15000);

const DEFAULT_MAX_RESULTS = Number(process.env.SEARXNG_MAX_RESULTS || 10);

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export async function searchWeb(
  query: string,
  options: ResearchSearchOptions = {},
): Promise<ResearchSearchResponse> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 3) {
    throw new Error("Search query must contain at least 3 characters.");
  }

  const limit = Math.min(Math.max(options.limit ?? DEFAULT_MAX_RESULTS, 1), 20);

  const searchUrl = new URL(`${SEARXNG_BASE_URL}/search`);

  searchUrl.searchParams.set("q", normalizedQuery);
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("language", options.language || "en");
  searchUrl.searchParams.set("safesearch", "1");
  searchUrl.searchParams.set("pageno", "1");

  if (options.categories?.length) {
    searchUrl.searchParams.set("categories", options.categories.join(","));
  }

  let response: Response;

  try {
    response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "ResearchOS/1.0",
      },
      signal: AbortSignal.timeout(SEARXNG_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("SearXNG search request timed out.");
    }

    throw new Error(
      `Unable to connect to SearXNG: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");

    throw new Error(
      `SearXNG returned HTTP ${response.status}. ${responseText.slice(0, 300)}`,
    );
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      "SearXNG did not return JSON. Check that format=json is enabled in settings.yml.",
    );
  }

  const rawData: unknown = await response.json();

  const parsedResponse = SearxResponseSchema.safeParse(rawData);

  if (!parsedResponse.success) {
    throw new Error("Invalid response structure received from SearXNG.");
  }

  const results: ResearchSearchResult[] = parsedResponse.data.results
    .filter((result) => {
      return Boolean(
        result.title?.trim() && result.url?.trim() && extractDomain(result.url),
      );
    })
    .slice(0, limit)
    .map((result) => ({
      title: result.title!.trim(),
      url: result.url!.trim(),
      description: result.content?.trim() || "",
      engine: result.engine,
      score: result.score,
      category: result.category,
      publishedAt: result.publishedDate || undefined,
      domain: extractDomain(result.url!),
    }));

  return {
    query: normalizedQuery,
    totalResults: parsedResponse.data.number_of_results ?? results.length,
    results,
  };
}
