import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import test from 'node:test';
import { shouldSkip, ignoredBuildExit } from './vercel-ignore-build.mjs';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml');
const read = file => fs.readFileSync(file, 'utf8');
const workflow = file => yaml.load(read(`.github/workflows/${file}.yml`));
const env = { VERCEL_GIT_PREVIOUS_SHA: 'a'.repeat(40), VERCEL_GIT_COMMIT_SHA: 'b'.repeat(40) };

test('Private ticket checkpoint records skip, while every public update builds', () => {
  assert.equal(shouldSkip(['data/waug/catalog.json', 'data/waug/queue.json']), true);
  assert.equal(shouldSkip(['data/waug/editorial.json', 'data/waug/research-jobs/job.json']), true);
  for (const file of [
    'data/waug/published.json', 'data/waug/listings.json', 'data/waug/booking-guarantees.json',
    'data/place-articles.json', 'data/course-articles.json', 'data/city-tour-articles.json',
    'data/weekend-prep.json', 'public/ticket-images/draft.jpg', 'public/prep-images/cover.webp',
    'app/page.tsx', 'lib/tickets.ts', 'package-lock.json', 'next.config.mjs',
    'scripts/vercel-ignore-build.mjs', 'unclassified.json',
  ]) assert.equal(shouldSkip(['data/waug/queue.json', file]), false, file);
});

test('Missing history, missing SHA and manual force never suppress a deployment', () => {
  for (const values of [{}, { ...env, VERCEL_GIT_PREVIOUS_SHA: '' }, { ...env, VERCEL_GIT_COMMIT_SHA: 'invalid' }, { ...env, FORCE_VERCEL_BUILD: '1' }]) {
    assert.equal(ignoredBuildExit(values, () => 'data/waug/queue.json\0'), 1);
  }
  assert.equal(ignoredBuildExit(env, () => { throw Error('missing history'); }), 1);
  assert.equal(ignoredBuildExit(env, () => ''), 1);
  assert.equal(ignoredBuildExit(env, () => 'data/waug/queue.json\0'), 0);
  assert.equal(ignoredBuildExit(env, args => {
    assert.deepEqual(args.slice(4, 6), [env.VERCEL_GIT_PREVIOUS_SHA, env.VERCEL_GIT_COMMIT_SHA]);
    return 'app/page.tsx\0data/waug/queue.json\0';
  }), 1, 'An app change before the latest checkpoint still builds');
});

test('Today\'s real checkpoint skips; guarantees and the 17-article batch build', () => {
  const git = args => execFileSync('git', args, { encoding: 'utf8' });
  const sha = rev => git(['rev-parse', rev]).trim();
  for (const [rev, expected] of [['ca8fe18', 0], ['89a1598', 1], ['a132644', 1]]) {
    assert.equal(ignoredBuildExit({ VERCEL_GIT_PREVIOUS_SHA: sha(rev + '^'), VERCEL_GIT_COMMIT_SHA: sha(rev) }, git), expected, rev);
  }
  assert.equal(ignoredBuildExit({ VERCEL_GIT_PREVIOUS_SHA: sha('ca8fe18^'), VERCEL_GIT_COMMIT_SHA: sha('a132644') }, git), 1);
});

test('Only daily owns the scheduled publication; editor and manual worker serialize', () => {
  const daily = workflow('daily'), manual = workflow('waug'), editor = workflow('waug-editorial');
  assert.deepEqual(daily.on.schedule, [{ cron: '0 20 * * *' }]);
  assert.equal(manual.on.schedule, undefined);
  assert.ok(manual.on.workflow_dispatch.inputs.action);
  assert.equal(daily.concurrency.group, manual.concurrency.group);
  assert.equal(daily.concurrency.group, editor.concurrency.group);
  for (const file of ['weekend-prep', 'articles', 'courses', 'test-articles']) {
    assert.equal(daily.concurrency.group, workflow(file).concurrency.group, `${file} also protects publication history`);
  }
  assert.equal(daily.concurrency['cancel-in-progress'], false);
  const steps = daily.jobs.daily.steps;
  const ticket = steps.find(s => s.run?.includes('scripts/waug/manage.mjs run'));
  const guarantees = steps.find(s => s.run === 'node scripts/waug/refresh-booking-guarantees.mjs');
  const commit = steps.find(s => s.id === 'commit');
  assert.equal(ticket['continue-on-error'], true);
  assert.equal(guarantees['continue-on-error'], true);
  assert.equal(ticket.if, "steps.ticket_rules.outcome == 'success'");
  assert.ok(steps.indexOf(ticket) < steps.indexOf(commit));
  assert.ok(steps.indexOf(guarantees) < steps.indexOf(commit));
  for (const file of ['published', 'editorial', 'catalog', 'places', 'queue', 'booking-guarantees']) {
    assert.ok(commit.run.includes(`data/waug/${file}.json`), file);
  }
  assert.equal(steps.filter(s => s.run?.includes('git commit')).length, 1);
  assert.equal(steps.some(s => s.run?.includes('scripts/revalidatePublished.mjs')), false);
  assert.ok(commit.run.includes('exit 1'), 'A failed push must be reported as a failure');
  assert.equal(JSON.parse(read('vercel.json')).ignoreCommand, 'node scripts/vercel-ignore-build.mjs');
});
