import "dotenv/config";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import * as cheerio from "cheerio";
import ipaddr from "ipaddr.js";

export interface ExtractedWebContent {
  url: string;
  title: string;
  description: string;
  domain: string;
  content: string;
  publishedAt?: string;
  fetchedAt: Date;
  contentLength: number;
}

export interface ExtractionOptions {
  timeoutMs?: number;
  maxContentLength?: number;
  maxResponseBytes?: number;
  maxRedirects?: number;
}

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_CONTENT_LENGTH = 30000;
const DEFAULT_MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const DEFAULT_MAX_REDIRECTS = 5;

const USER_AGENT = "ResearchOS/1.0 (Research Content Extraction)";

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

function isPublicIp(address: string): boolean {
  try {
    let parsed = ipaddr.parse(address);

    if (
      parsed.kind() === "ipv6" &&
      (parsed as ipaddr.IPv6).isIPv4MappedAddress()
    ) {
      parsed = (parsed as ipaddr.IPv6).toIPv4Address();
    }

    return parsed.range() === "unicast";
  } catch {
    return false;
  }
}

async function validateUrl(input: string): Promise<URL> {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw new Error("Invalid URL supplied for content extraction.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  if (url.username || url.password) {
    throw new Error("URLs containing credentials are not allowed.");
  }

  if (url.port && !["80", "443"].includes(url.port)) {
    throw new Error("Non-standard URL ports are not allowed.");
  }

  const hostname = url.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Requests to local or internal hosts are not allowed.");
  }

  const ipVersion = isIP(hostname);

  if (ipVersion) {
    if (!isPublicIp(hostname)) {
      throw new Error("Requests to private IP addresses are not allowed.");
    }
  } else {
    let addresses;

    try {
      addresses = await lookup(hostname, {
        all: true,
        verbatim: true,
      });
    } catch {
      throw new Error(`Unable to resolve hostname: ${hostname}`);
    }

    if (
      addresses.length === 0 ||
      addresses.some((entry) => !isPublicIp(entry.address))
    ) {
      throw new Error("URL resolves to a private or restricted IP address.");
    }
  }

  url.hash = "";

  return url;
}

async function readResponseBody(
  response: Response,
  maxBytes: number,
): Promise<string> {
  if (!response.body) {
    throw new Error("The website returned an empty response.");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new Error(
          `Website response exceeded the ${maxBytes} byte limit.`,
        );
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const buffer = Buffer.concat(chunks);

  return new TextDecoder("utf-8").decode(buffer);
}

function extractMetadata($: cheerio.CheerioAPI) {
  const title =
    $("meta[property='og:title']").attr("content")?.trim() ||
    $("meta[name='twitter:title']").attr("content")?.trim() ||
    $("title").first().text().trim() ||
    $("h1").first().text().trim();

  const description =
    $("meta[name='description']").attr("content")?.trim() ||
    $("meta[property='og:description']").attr("content")?.trim() ||
    $("meta[name='twitter:description']").attr("content")?.trim() ||
    "";

  const publishedAt =
    $("meta[property='article:published_time']").attr("content") ||
    $("meta[name='date']").attr("content") ||
    $("meta[name='publishdate']").attr("content") ||
    undefined;

  return {
    title: normalizeWhitespace(title || ""),
    description: normalizeWhitespace(description),
    publishedAt,
  };
}

function extractMainContent($: cheerio.CheerioAPI): string {
  $(
    [
      "script",
      "style",
      "noscript",
      "iframe",
      "svg",
      "canvas",
      "nav",
      "footer",
      "header",
      "aside",
      "form",
      "button",
      "input",
      "select",
      "textarea",
      "[hidden]",
      "[aria-hidden='true']",
      "[role='navigation']",
      "[role='banner']",
      "[role='contentinfo']",
    ].join(","),
  ).remove();

  const mainSelectors = [
    "article",
    "main",
    "[role='main']",
    ".article-content",
    ".post-content",
    ".entry-content",
    ".content",
  ];

  for (const selector of mainSelectors) {
    const element = $(selector).first();

    if (element.length) {
      const text = normalizeWhitespace(element.text());

      if (text.length >= 200) {
        return text;
      }
    }
  }

  return normalizeWhitespace($("body").text());
}

async function fetchHtml(
  initialUrl: string,
  options: ExtractionOptions,
): Promise<{ html: string; finalUrl: string }> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;

  let currentUrl = initialUrl;

  for (let redirectCount = 0; ; redirectCount++) {
    const validatedUrl = await validateUrl(currentUrl);

    const response = await fetch(validatedUrl, {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");

      await response.body?.cancel();

      if (!location) {
        throw new Error("Website returned a redirect without a location.");
      }

      if (redirectCount >= maxRedirects) {
        throw new Error("Maximum redirect limit exceeded.");
      }

      currentUrl = new URL(location, validatedUrl).toString();

      continue;
    }

    if (!response.ok) {
      await response.body?.cancel();

      throw new Error(`Website returned HTTP ${response.status}.`);
    }

    const contentType = (
      response.headers.get("content-type") || ""
    ).toLowerCase();

    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      await response.body?.cancel();

      throw new Error(
        `Unsupported website content type: ${contentType || "unknown"}`,
      );
    }

    const html = await readResponseBody(response, maxBytes);

    return {
      html,
      finalUrl: validatedUrl.toString(),
    };
  }
}

export async function extractWebContent(
  inputUrl: string,
  options: ExtractionOptions = {},
): Promise<ExtractedWebContent> {
  if (!inputUrl?.trim()) {
    throw new Error("A website URL is required.");
  }

  const { html, finalUrl } = await fetchHtml(inputUrl.trim(), options);

  const $ = cheerio.load(html);

  const metadata = extractMetadata($);

  const extractedContent = extractMainContent($);

  const maxContentLength =
    options.maxContentLength ?? DEFAULT_MAX_CONTENT_LENGTH;

  const content = extractedContent.slice(0, maxContentLength);

  if (content.length < 100) {
    throw new Error(
      "Unable to extract sufficient readable content from the website.",
    );
  }

  const parsedUrl = new URL(finalUrl);

  return {
    url: finalUrl,
    title: metadata.title || parsedUrl.hostname,
    description: metadata.description,
    domain: parsedUrl.hostname.replace(/^www\./, ""),
    content,
    publishedAt: metadata.publishedAt,
    fetchedAt: new Date(),
    contentLength: content.length,
  };
}
