import fs from 'node:fs';
import path from 'node:path';

export const dayKST = (date = new Date()) => date.toLocaleDateString('sv-SE', {timeZone: 'Asia/Seoul'});
const read = (root, file, fallback) => {
  const target = path.join(root, file);
  return fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, 'utf8')) : fallback;
};

export function publicationBudget(root = process.cwd(), now = new Date()) {
  const policy = read(root, 'data/publication-policy.json', {general: {daily: 30}});
  const day = dayKST(now);
  const published = new Set();
  const categories = {};
  for (const file of ['place-articles', 'course-articles', 'city-tour-articles']) {
    const rows = read(root, `data/${file}.json`, {}).articles || {};
    for (const [id, article] of Object.entries(rows)) {
      if (article.publishedAt && dayKST(new Date(article.publishedAt)) === day && article.status !== 'draft' && article.status !== 'held') {
        published.add(`${file}:${article.id || id}`);
        categories[file] = (categories[file] || 0) + 1;
      }
    }
  }
  return {day, published: published.size, unreserved: Math.max(0, policy.general.daily - published.size), categories};
}

export function newArticleAllowance(root = process.cwd(), category) {
  const budget = publicationBudget(root);
  const policy = read(root, 'data/publication-policy.json', {general: {daily: 30, categories: {}}});
  return Math.min(budget.unreserved, category
    ? Math.max(0, (policy.general.categories?.[category] ?? 10) - (budget.categories[category] || 0))
    : policy.general.daily);
}
