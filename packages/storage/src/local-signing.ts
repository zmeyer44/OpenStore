import { createHmac, timingSafeEqual } from "node:crypto";

const DEV_SIGNING_SECRET = "locker-local-dev-signing-secret";

function getSigningSecret(): string {
  const secret =
    process.env.LOCAL_BLOB_SIGNING_SECRET ?? process.env.BETTER_AUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "LOCAL_BLOB_SIGNING_SECRET (or BETTER_AUTH_SECRET) must be set in production",
    );
  }

  return DEV_SIGNING_SECRET;
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createLocalFileSignature(
  filePath: string,
  expiresAt: number,
): string {
  return createHmac("sha256", getSigningSecret())
    .update(`${filePath}:${expiresAt}`)
    .digest("base64url");
}

export function verifyLocalFileSignature(
  filePath: string,
  expiresAt: number,
  signature: string,
): boolean {
  const expected = createLocalFileSignature(filePath, expiresAt);
  return safeEqual(expected, signature);
}
