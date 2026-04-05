import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../server/auth";
import { headers } from "next/headers";
import { transcribeWithAI } from "../../../server/ai/transcribe";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(req: NextRequest) {
  // Authenticate via session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  const fileName = req.headers.get("x-file-name") ?? "file";

  const ALLOWED_MODELS = new Set([
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "anthropic/claude-sonnet-4-20250514",
  ]);
  const rawModel = req.headers.get("x-model");
  const model = rawModel && ALLOWED_MODELS.has(rawModel) ? rawModel : undefined;

  const isImage = contentType.startsWith("image/");
  const isPdf = contentType === "application/pdf";

  if (!isImage && !isPdf) {
    return NextResponse.json(
      { error: "Unsupported file type. Send an image or PDF." },
      { status: 400 },
    );
  }

  const body = await req.arrayBuffer();
  if (body.byteLength === 0) {
    return NextResponse.json({ error: "Empty request body" }, { status: 400 });
  }
  if (body.byteLength > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum 20MB." },
      { status: 413 },
    );
  }

  try {
    const content = await transcribeWithAI({
      buffer: Buffer.from(body),
      fileName: decodeURIComponent(fileName),
      mimeType: contentType,
      model,
    });

    return NextResponse.json({ content });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
