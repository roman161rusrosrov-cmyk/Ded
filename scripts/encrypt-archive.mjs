import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomBytes, pbkdf2Sync, createCipheriv } from "node:crypto";
import path from "node:path";

const source = process.argv[2] ?? "private-content/archive.json";
const output = process.argv[3] ?? "assets/secure/archive.enc.json";
const password = process.env.SFI_ARCHIVE_PASSWORD;

if (!password) throw new Error("SFI_ARCHIVE_PASSWORD is required");

const plaintext = await readFile(source);
const salt = randomBytes(16);
const iv = randomBytes(12);
const iterations = 310_000;
const key = pbkdf2Sync(password, salt, iterations, 32, "sha256");
const cipher = createCipheriv("aes-256-gcm", key, iv);
const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
const tag = cipher.getAuthTag();

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({
  version: 1,
  algorithm: "AES-GCM",
  derivation: "PBKDF2-SHA-256",
  iterations,
  salt: salt.toString("base64"),
  iv: iv.toString("base64"),
  ciphertext: Buffer.concat([ciphertext, tag]).toString("base64")
})}\n`);

console.log(`Encrypted ${plaintext.length} bytes -> ${output}`);
