import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("feature and release integration use the explicit develop boundary", async () => {
  const [agents, readme, deployment, reproducibility] = await Promise.all([
    readFile(new URL("AGENTS.md", root), "utf8"),
    readFile(new URL("README.md", root), "utf8"),
    readFile(new URL("docs/deployment.md", root), "utf8"),
    readFile(new URL("docs/reproducibility.md", root), "utf8"),
  ]);

  for (const source of [agents, readme, deployment]) {
    assert.match(source, /feature(?: branches| on a fresh)/i);
    assert.match(source, /rebase/i);
    assert.match(source, /develop/i);
    assert.match(source, /main/i);
    assert.match(source, /(?:owner-reviewed pull request|pull request[\s\S]{0,100}(?:reviewed|rebase-merged)[\s\S]{0,50}owner)/i);
    assert.match(source, /fresh[\s\S]{0,100}(?:origin\/)?develop/i);
  }

  assert.match(agents, /`develop` is the shared root workspace and feature-integration branch/i);
  assert.match(agents, /Only the integration owner serializes\s+validated task commits/i);
  assert.match(agents, /must not push to, merge, or\s+otherwise update `main` directly/i);
  assert.match(readme, /`develop` is the shared Git workspace/i);
  assert.match(readme, /Sites checkpoint may use an exact validated and\s+pushed `develop` commit/i);
  assert.match(deployment, /`develop` is the shared integration workspace/i);
  assert.match(deployment, /accepted maintained Sites source branch/i);
  assert.match(agents, /`develop` is an accepted maintained source branch for Sites checkpoints/i);
  assert.match(reproducibility, /never relabel a feature-branch result as `develop` or `main`/i);
});
