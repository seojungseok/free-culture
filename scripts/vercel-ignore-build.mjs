import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// These records are consumed by workers, never by the public application.
// Published articles, listings, guarantees, assets and unknown files always build.
export function isNonRuntimePath(file) {
  return /^(docs\/|\.github\/|\.cache\/)/.test(file) ||
    /^(README\.md|AGENTS\.md)$/.test(file);
}

export function shouldSkip(files) {
  return files.length > 0 && files.every(isNonRuntimePath);
}

export function ignoredBuildExit(env = process.env, git = args => execFileSync('git', args, { encoding: 'utf8' })) {
  // Compare with the last successful deployment, not HEAD^: earlier skipped
  // commits must not hide an app change from a subsequent deployment.
  const previous = env.VERCEL_GIT_PREVIOUS_SHA;
  const current = env.VERCEL_GIT_COMMIT_SHA;
  if (env.FORCE_VERCEL_BUILD === '1' || !previous || !current || previous === current) return 1;
  if (!/^[a-f0-9]{40}$/i.test(previous) || !/^[a-f0-9]{40}$/i.test(current)) return 1;
  try {
    const files = git(['diff', '--name-only', '--no-renames', '-z', previous, current, '--']).split('\0').filter(Boolean);
    return shouldSkip(files) ? 0 : 1;
  } catch {
    // Missing/shallow history or any uncertainty must preserve public updates.
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const code = ignoredBuildExit();
  console.log(code === 0 ? 'Skip: private operational records only.' : 'Build: public changes or unverified history.');
  process.exitCode = code;
}
