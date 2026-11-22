import fs from "node:fs/promises";
import mammoth from "mammoth";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export interface ExtractedPage {
  pageContent: string;
  page?: number;
}

export async function extractDocument(
  filePath: string,
  mimeType: string,
): Promise<ExtractedPage[]> {
  // PDF extraction
  if (mimeType === "application/pdf") {
    const buffer = await fs.readFile(filePath);

    const pdf = await getDocument({
      data: new Uint8Array(buffer),
    }).promise;

    const pages: ExtractedPage[] = [];

    try {
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();

        const text = content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .trim();

        if (text) {
          pages.push({
            pageContent: text,
            page: pageNumber,
          });
        }
      }
    } finally {
      await pdf.loadingTask.destroy();
    }

    return pages;
  }

  // DOCX extraction
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({
      path: filePath,
    });

    return [
      {
        pageContent: result.value.trim(),
      },
    ];
  }

  // TXT extraction
  if (mimeType === "text/plain") {
    const text = await fs.readFile(filePath, "utf-8");

    return [
      {
        pageContent: text.trim(),
      },
    ];
  }

  throw new Error("Unsupported document format");
}
