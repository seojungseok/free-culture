// Exit 75 means a provider's daily allowance deferred an optional backfill.
// Authentication, malformed responses, local budget bugs and other failures
// remain failures. Never retry a quota response with another credential.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export async function runCollector(script, { args = [], env = process.env,
  output = env.GITHUB_OUTPUT, summary = env.GITHUB_STEP_SUMMARY, log = console.log } = {}) {
  const result = await new Promise((resolve) => {
    const child = spawn(process.execPath, [script, ...args], { env, stdio: "inherit" });
    child.once("error", () => resolve({ code: 1, signal: null }));
    child.once("close", (code, signal) => resolve({ code, signal }));
  });
  const status = !result.signal && result.code === 75 ? "deferred"
    : !result.signal && result.code === 0 ? "success" : "failure";
  if (output) fs.appendFileSync(output, `collector_status=${status}\n`);
  const label = path.basename(script).replace(/[^\w.-]/g, "");
  if (status === "deferred") {
    log("::warning::공공 API 제공기관의 호출 한도로 보강을 연기했습니다. 기존 정보를 보존했으며 다음 예약 실행에서 다시 시도합니다.");
  }
  if (summary) fs.appendFileSync(summary, `- ${label}: ${status === "deferred" ? "제공기관 한도 도달 — 상세 보강 연기, 기존 정보 유지" : status}\n`);
  return { status, exitCode: status === "failure" ? 1 : 0 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const script = process.argv[2];
  if (!script) { console.error("수집 스크립트 경로가 필요합니다."); process.exitCode = 1; }
  else { const result = await runCollector(script, { args: process.argv.slice(3) }); process.exitCode = result.exitCode; }
}
