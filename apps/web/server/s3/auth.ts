import { createHmac, createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { getDb } from '@locker/database/client';
import { s3ApiKeys, workspaces } from '@locker/database';
import { eq, and } from 'drizzle-orm';

const ACCESS_KEY_PREFIX = 'LKAK';
const ACCESS_KEY_LENGTH = 20;
const SECRET_KEY_BYTES = 40;
const ALGORITHM = 'aes-256-gcm';

// ── Key encryption/decryption ───────────────────────────────────────────

function getEncryptionKey(): Buffer {
  const secret = process.env.S3_API_KEY_ENCRYPTION_SECRET;
  if (!secret) throw new Error('S3_API_KEY_ENCRYPTION_SECRET not configured');
  return createHash('sha256').update(secret).digest();
}

export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all base64)
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSecret(stored: string): string {
  const key = getEncryptionKey();
  const [ivB64, tagB64, dataB64] = stored.split(':');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Invalid encrypted secret format');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final('utf8');
}

// ── Key generation ──────────────────────────────────────────────────────

export function generateAccessKeyId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = ACCESS_KEY_PREFIX;
  const bytes = randomBytes(ACCESS_KEY_LENGTH);
  for (let i = 0; i < ACCESS_KEY_LENGTH; i++) {
    result += chars[bytes[i]! % chars.length];
  }
  return result;
}

export function generateSecretKey(): string {
  return randomBytes(SECRET_KEY_BYTES).toString('base64url');
}

// ── SigV4 verification ─────────────────────────────────────────────────

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

function sha256Hex(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

interface SigV4Result {
  workspaceId: string;
  workspaceSlug: string;
  keyId: string;
  userId: string;
  permissions: string;
}

export async function verifySignatureV4(
  req: Request,
  rawBody?: Buffer,
): Promise<SigV4Result | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('AWS4-HMAC-SHA256')) return null;

  // Parse: AWS4-HMAC-SHA256 Credential=OSAKXXX/date/region/s3/aws4_request, SignedHeaders=..., Signature=...
  const credMatch = authHeader.match(/Credential=([^/]+)\/(\d{8})\/([^/]+)\/s3\/aws4_request/);
  const headersMatch = authHeader.match(/SignedHeaders=([^,]+)/);
  const sigMatch = authHeader.match(/Signature=([a-f0-9]+)/);

  if (!credMatch || !headersMatch || !sigMatch) return null;

  const accessKeyId = credMatch[1]!;
  const dateStamp = credMatch[2]!;
  const region = credMatch[3]!;
  const signedHeaderNames = headersMatch[1]!.split(';');
  const providedSignature = sigMatch[1]!;

  // Look up the API key
  const db = getDb();
  const [keyRecord] = await db
    .select({
      id: s3ApiKeys.id,
      workspaceId: s3ApiKeys.workspaceId,
      userId: s3ApiKeys.userId,
      encryptedSecret: s3ApiKeys.encryptedSecret,
      permissions: s3ApiKeys.permissions,
      isActive: s3ApiKeys.isActive,
      expiresAt: s3ApiKeys.expiresAt,
    })
    .from(s3ApiKeys)
    .where(eq(s3ApiKeys.accessKeyId, accessKeyId));

  if (!keyRecord || !keyRecord.isActive) return null;
  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) return null;

  // Get workspace slug
  const [ws] = await db
    .select({ slug: workspaces.slug })
    .from(workspaces)
    .where(eq(workspaces.id, keyRecord.workspaceId));

  if (!ws) return null;

  // Decrypt the secret
  let secretKey: string;
  try {
    secretKey = decryptSecret(keyRecord.encryptedSecret);
  } catch {
    return null;
  }

  // Build canonical request
  const url = new URL(req.url);
  const method = req.method;
  const canonicalUri = url.pathname;

  // Canonical query string (sorted)
  const params = Array.from(url.searchParams.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  const canonicalQueryString = params
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  // Canonical headers
  const canonicalHeaders = signedHeaderNames
    .map((name) => {
      const value = req.headers.get(name) ?? '';
      return `${name}:${value.trim()}\n`;
    })
    .join('');

  // Payload hash
  const payloadHash =
    req.headers.get('x-amz-content-sha256') ?? sha256Hex(rawBody ?? '');

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaderNames.join(';'),
    payloadHash,
  ].join('\n');

  // String to sign
  const amzDate = req.headers.get('x-amz-date') ?? '';
  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  // Derive signing key
  const kDate = hmacSha256(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, 's3');
  const kSigning = hmacSha256(kService, 'aws4_request');

  // Compute expected signature
  const expectedSignature = hmacSha256(kSigning, stringToSign).toString('hex');

  // Constant-time comparison
  if (expectedSignature.length !== providedSignature.length) return null;
  let mismatch = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    mismatch |= expectedSignature.charCodeAt(i) ^ providedSignature.charCodeAt(i);
  }
  if (mismatch !== 0) return null;

  // Update last_used_at (fire-and-forget)
  db.update(s3ApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(s3ApiKeys.id, keyRecord.id))
    .catch(() => {});

  return {
    workspaceId: keyRecord.workspaceId,
    workspaceSlug: ws.slug,
    keyId: keyRecord.id,
    userId: keyRecord.userId,
    permissions: keyRecord.permissions,
  };
}
