import { generateText, createGateway } from "ai";

const DEFAULT_MODEL = "openai/gpt-4o";

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

/**
 * Transcribe a file (image or PDF) into markdown using the Vercel AI Gateway.
 *
 * Accepts a binary buffer and returns a markdown description of the content.
 * Uses the gateway to route to the configured model provider.
 */
export async function transcribeWithAI(params: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  model?: string;
}): Promise<string> {
  const { buffer, fileName, mimeType, model } = params;

  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error(
      "AI_GATEWAY_API_KEY is not configured. Set it in your environment to use the built-in transcription.",
    );
  }

  const modelId = model || process.env.AI_GATEWAY_MODEL || DEFAULT_MODEL;

  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  if (!isImage && !isPdf) {
    throw new Error(`Unsupported MIME type for transcription: ${mimeType}`);
  }

  const systemPrompt = [
    "You are a document transcription assistant.",
    "Your task is to produce a detailed, accurate markdown description of the provided file.",
    "For images: describe the visual content, any text visible in the image, layout, and key details.",
    "For PDFs: extract and reproduce the text content, preserving structure with markdown headings, lists, and formatting.",
    "Output only the markdown content. Do not wrap it in code fences.",
  ].join(" ");

  const filePart = isImage
    ? { type: "image" as const, image: buffer }
    : {
        type: "file" as const,
        data: buffer,
        mediaType: mimeType as "application/pdf",
      };

  const { text } = await generateText({
    model: gateway(modelId),
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          filePart,
          {
            type: "text",
            text: `Transcribe this file: "${fileName}"`,
          },
        ],
      },
    ],
  });

  if (!text || text.trim().length === 0) {
    throw new Error("AI model returned empty transcription");
  }

  return text.trim();
}
