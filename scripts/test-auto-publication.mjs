import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {createRequire} from 'node:module';
import {shouldSkip, ignoredBuildExit} from './vercel-ignore-build.mjs';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml');

test('public content always triggers a build', () => {
  assert.equal(shouldSkip(['docs/operations.md']), true);
  for (const file of ['data/weekend-prep.json', 'app/page.tsx', 'app/sitemap.ts']) {
    assert.equal(shouldSkip([file]), false, file);
  }
  assert.equal(ignoredBuildExit({}, () => ''), 1);
});

test('daily workflow publishes informational content only', () => {
  const daily = yaml.load(fs.readFileSync('.github/workflows/daily.yml', 'utf8'));
  const steps = daily.jobs.daily.steps;
  assert.deepEqual(daily.on.schedule, [{cron: '0 20 * * *'}]);
  assert.equal(steps.some(step => /scripts\/(?:waug|prep\/publish|collectCoupang)/i.test(step.run || '')), false);
  assert.equal(steps.some(step => step.id === 'commit'), true);
});
