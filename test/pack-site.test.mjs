import assert from "node:assert/strict";
import { access, rm } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const out = join(root, ".tmp-pack-site-test");

test("pack-site copies catalog assets into out dir", async () => {
  await rm(out, { recursive: true, force: true });
  const result = spawnSync(process.execPath, ["scripts/pack-site.mjs", "--out", out, "--cname"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  for (const rel of ["index.html", "styles.css", ".nojekyll", "robots.txt", "CNAME", "src/catalog.js", "talks/index.json"]) {
    await access(join(out, rel));
  }
  await rm(out, { recursive: true, force: true });
});
