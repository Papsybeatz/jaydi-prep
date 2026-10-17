import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import "pdfjs-dist/legacy/build/pdf.worker.mjs";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_RESUME_CHARS = 20_000;

type ParseResponse = { text: string; fileName: string } | { error: string };

function jsonResponse(body: ParseResponse, status = 200): Response {
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return jsonResponse({ error: "Upload a PDF or DOCX resume file." }, 415);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.warn("Could not read uploaded resume form data.", error);
    return jsonResponse({ error: "The uploaded file could not be read." }, 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonResponse({ error: "Choose a PDF or DOCX resume file." }, 400);
  }
  if (file.size === 0) {
    return jsonResponse({ error: "The selected file is empty." }, 400);
  }
  if (file.size > MAX_FILE_SIZE) {
    return jsonResponse(
      { error: "The file is too large. Please choose a file smaller than 4 MB." },
      413,
    );
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== "pdf" && extension !== "docx") {
    return jsonResponse(
      { error: "Unsupported file type. Upload a PDF or DOCX resume." },
      415,
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let text: string;

  try {
    if (extension === "pdf") {
      if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") {
        return jsonResponse({ error: "This file is not a valid PDF." }, 400);
      }

      const parser = new PDFParse({ data: bytes });
      try {
        const result = await parser.getText();
        text = result.text;
      } finally {
        await parser.destroy();
      }
    } else {
      if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
        return jsonResponse({ error: "This file is not a valid DOCX document." }, 400);
      }

      const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      text = result.value;
    }
  } catch (error) {
    console.error("Failed to extract text from uploaded resume.", error);
    return jsonResponse(
      {
        error:
          "We couldn't read this file. It may be damaged, password-protected, or contain no extractable text.",
      },
      422,
    );
  }

  const extractedText = text.replace(/\u0000/g, "").trim();
  if (!extractedText) {
    return jsonResponse(
      {
        error:
          "No text could be extracted. Scanned or image-only resumes need OCR; try a text-based PDF or DOCX.",
      },
      422,
    );
  }
  if (extractedText.length > MAX_RESUME_CHARS) {
    return jsonResponse(
      {
        error:
          "The extracted resume is over 20,000 characters. Shorten the document and upload it again.",
      },
      413,
    );
  }

  return jsonResponse({ text: extractedText, fileName: file.name });
}
