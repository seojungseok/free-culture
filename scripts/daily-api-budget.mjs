import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function dailyApiBudget(now = new Date()) {
  const monday = new Date(now.getTime() + 9 * 3600000).getUTCDay() === 1;
  const details = monday ? 20 : 100;
  const images = monday ? 10 : 30;
  const weekly = monday ? 850 : 0;
  return { details, images, festivals: 10, festivalDetails: 90, weekly,
    total: weekly + 10 + 90 + details + images };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const budget = dailyApiBudget();
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,
    `details=${budget.details}\nimages=${budget.images}\n`);
  console.log(JSON.stringify(budget));
}
