import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runCollector } from "./run-collector.mjs";

test("a provider deferral is visible and does not erase an authentication failure", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "mwohaji-collector-"));
  try {
    const output = path.join(dir, "output"), summary = path.join(dir, "summary"), logs = [];
    for (const [code, expected] of [[0, "success"], [75, "deferred"], [1, "failure"], [22, "failure"]]) {
      const script = path.join(dir, `fixture-${code}.mjs`);
      await fs.writeFile(script, `process.exitCode = ${code};`);
      const result = await runCollector(script, { output, summary, log: (line) => logs.push(line) });
      assert.equal(result.status, expected);
      assert.equal(result.exitCode, expected === "failure" ? 1 : 0);
    }
    assert.deepEqual((await fs.readFile(output, "utf8")).trim().split("\n"), [
      "collector_status=success", "collector_status=deferred", "collector_status=failure", "collector_status=failure",
    ]);
    assert.equal(logs.length, 1);
    assert.match(logs[0], /::warning::/);
    assert.match(await fs.readFile(summary, "utf8"), /보강 연기/);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test("a missing collector remains a workflow failure", async () => {
  const result = await runCollector(path.join(os.tmpdir(), "mwohaji-missing-collector.mjs"), { env: {}, log: () => {} });
  assert.equal(result.status, "failure");
  assert.equal(result.exitCode, 1);
});
