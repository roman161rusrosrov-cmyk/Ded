import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

test("GitHub Pages bundle contains the access gate and relative assets", async () => {
  const [html, script] = await Promise.all([readFile("site/index.html", "utf8"), readFile("site/app.js", "utf8")]);
  assert.match(html, /SFI \/\/ BLACK CHRONICLE/);
  assert.match(script, /secure\/archive\.enc\.json/);
  assert.doesNotMatch(script, /SFI_ARCHIVE_PASSWORD\s*=/);
  await Promise.all([access("site/styles.css"), access("site/secure/archive.enc.json"), access("site/media/death-scene.webp")]);
});

test("GitHub Pages bundle does not publish plaintext canon", async () => {
  const files = ["site/index.html", "site/app.js", "site/styles.css", "site/secure/archive.enc.json"];
  for (const file of files) assert.equal((await readFile(file, "utf8")).includes("Уильям погиб в авиакатастрофе"), false, `${file} exposed canon`);
});
