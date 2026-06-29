import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32; // 256 bits

/**
 * Returns the encryption key from the environment.
 * The key must be a 64-character hex string (32 bytes).
 */
function getKey(): Buffer {
  const hexKey = process.env.ENCRYPTION_KEY;
  if (!hexKey || hexKey.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-character hex string. Generate with: openssl rand -hex 32"
    );
  }
  return Buffer.from(hexKey, "hex");
}

export interface EncryptedPayload {
  ciphertext: string; // base64-encoded encrypted data
  iv: string; // base64-encoded initialization vector
}

/**
 * Encrypts a plaintext string using AES-256-CBC.
 *
 * Each call generates a fresh random IV so identical plaintexts
 * produce different ciphertexts (semantic security).
 */
export function encrypt(plaintext: string): EncryptedPayload {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  return {
    ciphertext: encrypted,
    iv: iv.toString("base64"),
  };
}

/**
 * Decrypts an AES-256-CBC encrypted payload back to plaintext.
 * Used by compliance officers when reviewing quarantined prompts.
 */
export function decrypt(payload: EncryptedPayload): string {
  const key = getKey();
  const iv = Buffer.from(payload.iv, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(payload.ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
