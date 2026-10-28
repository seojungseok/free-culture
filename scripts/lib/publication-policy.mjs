import fs from "node:fs";
import path from "node:path";

function readPolicy(root) {
  const file = path.join(root, "data", "publication-policy.json");
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return { general: { daily: 0, categories: {}, newPublicationEnabled: false } };
  }
}

/**
 * A single hard stop for every automatic writer.  This is intentionally
 * independent of a workflow's environment variables, so a manual dispatch
 * cannot accidentally resume new public pages while editorial review is on.
 */
export function isNewPublicationEnabled(root = process.cwd()) {
  return readPolicy(root).general?.newPublicationEnabled === true;
}

export function publicationMode(root = process.cwd()) {
  return readPolicy(root).general?.mode || "normal";
}
