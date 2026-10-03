import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function dailyApiBudget(now = new Date()) {
  const monday = new Date(now.getTime() + 9 * 3600000).getUTCDay() === 1;
  const details = monday ? 20 : 100;
  const images = monday ? 10 : 30;
  const weekly = monday ? 830 : 0,courseStops=20,coursePlaces=monday?20:100;
  return { details, images, festivals: 10, festivalDetails: 90, weekly,courseStops,coursePlaces,
    total: weekly + 10 + 90 + details + images+courseStops+coursePlaces };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const budget = dailyApiBudget();
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,
    `details=${budget.details}\nimages=${budget.images}\ncourse_stops=${budget.courseStops}\ncourse_places=${budget.coursePlaces}\n`);
  console.log(JSON.stringify(budget));
}
