import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const DEV_PLUGIN_SECRET = "locker-plugin-dev-secret";

function getPluginEncryptionKey(): Buffer {
  const secret =
    process.env.PLUGIN_ENCRYPTION_SECRET ??
    process.env.S3_API_KEY_ENCRYPTION_SECRET;

  if (secret) {
    return createHash("sha256").update(secret).digest();
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "PLUGIN_ENCRYPTION_SECRET must be configured in production. " +
        "Set this to a stable secret independent of BETTER_AUTH_SECRET so that " +
        "rotating your auth secret does not break stored plugin credentials.",
    );
  }

  return createHash("sha256").update(DEV_PLUGIN_SECRET).digest();
}

export function encryptPluginSecret(value: string): string {
  const key = getPluginEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptPluginSecret(value: string): string {
  const key = getPluginEncryptionKey();
  const [ivBase64, authTagBase64, encryptedBase64] = value.split(":");
  if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error("Invalid plugin secret format");
  }

  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    key,
    Buffer.from(ivBase64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
