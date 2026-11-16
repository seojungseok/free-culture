import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function dailyApiBudget(now = new Date()) {
  const weekday = new Date(now.getTime() + 9 * 3600000).getUTCDay(),monday=weekday===1,playgroundTour=weekday===2?72:0;
  const details = monday ? 20 : 100;
  const images = monday ? 10 : 30;
  const weekly = monday ? 830 : 0,courseStops=20,coursePlaces=monday?20:100,accessible=monday?0:60;
  return { details, images, festivals: 10, festivalDetails: 90, weekly,courseStops,coursePlaces,accessible,playgroundTour,
    total: weekly + 10 + 90 + details + images+courseStops+coursePlaces+accessible+playgroundTour };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const budget = dailyApiBudget();
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,
    `details=${budget.details}\nimages=${budget.images}\ncourse_stops=${budget.courseStops}\ncourse_places=${budget.coursePlaces}\naccessible=${budget.accessible}\n`);
  console.log(JSON.stringify(budget));
}
