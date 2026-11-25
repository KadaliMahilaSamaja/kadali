#!/usr/bin/env node
/**
 * Notify subscribed visitors about newly published content.
 *
 * Runs on GitHub Actions right after `wrangler pages deploy` (see
 * .github/workflows/deploy.yml): it diffs BEFORE_SHA..AFTER_SHA for new
 * entries under src/content/articles and src/content/events, then asks the
 * live site's push API for the subscription list, sends one web push per
 * new entry, and prunes the endpoints the push services report as dead.
 *
 * Also usable by hand, from anywhere:
 *
 *   node scripts/notify.mjs --test          # send a test notice to all subscribers
 *
 * Configuration is env-only (same names in Actions secrets and a local
 * shell): SITE_ORIGIN, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT,
 * PUSH_ADMIN_KEY, BEFORE_SHA, AFTER_SHA.
 *
 * Best-effort by design: a missing secret, an offline endpoint or a failing
 * push service warns loudly and exits 0 — a push outage must never fail a
 * deploy that already succeeded. A crash with a non-zero exit is a script
 * bug and deserves the red cross.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { sendNotification } from 'web-push';

const SITE_ORIGIN = process.env.SITE_ORIGIN ?? 'https://kadali.org';
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:contact@kadali.org';
const PUSH_ADMIN_KEY = process.env.PUSH_ADMIN_KEY ?? '';
const BEFORE_SHA = process.env.BEFORE_SHA ?? '';
const AFTER_SHA = process.env.AFTER_SHA ?? '';

// Matches the worker's /api/push/prune chunk limit (free-plan subrequests).
const PRUNE_CHUNK = 40;

// Only these collections announce; others (announcements, galleries…) can be
// added here when the club wants them.
const COLLECTIONS = {
  articles: { urlBase: '/articles/' },
  events: { urlBase: '/events/' },
};

const BODY_BY_COLLECTION = {
  articles: 'ಹೊಸ ಲೇಖನ ಪ್ರಕಟವಾಗಿದೆ — ಓದಿ.',
  events: 'ಹೊಸ ಕಾರ್ಯಕ್ರಮ ಪ್ರಕಟವಾಗಿದೆ — ವಿವರ ನೋಡಿ.',
};

const isZeroSha = (sha) => /^0+$/.test(sha);

const log = (...parts) => console.log('[notify]', ...parts);
const warn = (...parts) => console.warn('[notify]', ...parts);

/** Everything that should stop the run without drama, before any sending. */
function configProblems() {
  const problems = [];
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) problems.push('VAPID keys missing');
  if (!PUSH_ADMIN_KEY) problems.push('PUSH_ADMIN_KEY missing');
  return problems;
}

/** `title: "…"` / `draft: true` style single-line frontmatter fields. */
function frontmatterField(source, field) {
  const match = source.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
  if (!match) return undefined;
  return match[1].trim().replace(/^["']|["']$/g, '');
}

/**
 * New entries in the announcing-worthy collections between two commits.
 * `A` = announce; `M` = an edit of something already published — silent,
 * so typo fixes and poster swaps never ping anyone. Draft articles are
 * content, not news: they wait until they are really published.
 */
function newEntries(before, after) {
  const diff = execFileSync('git', ['diff', '--name-status', before, after, '--', 'src/content'], {
    encoding: 'utf8',
  });
  const entries = [];
  for (const line of diff.split('\n')) {
    const [status, filePath] = line.trim().split(/\s+/);
    if (status !== 'A') continue;
    const match = filePath?.match(/^src\/content\/(articles|events)\/(.+)\.md$/);
    if (!match) continue;
    const [, collection, slug] = match;
    const source = readFileSync(path.join(process.cwd(), filePath), 'utf8');
    if (collection === 'articles' && /^\s*draft:\s*true\b/m.test(source)) {
      log(`skipping draft article ${slug}`);
      continue;
    }
    entries.push({
      collection,
      slug,
      title: frontmatterField(source, 'title') ?? 'ಕದಳಿ ವನಿತಾ ಸಮಾಜ',
      url: `${COLLECTIONS[collection].urlBase}${slug}/`,
    });
  }
  return entries;
}

/** One notification payload per entry; tiny, well under the 4 KB push cap. */
function payloadFor(entry) {
  return JSON.stringify({
    title: entry.title,
    body: BODY_BY_COLLECTION[entry.collection],
    url: entry.url,
    tag: `${entry.collection}-${entry.slug}`,
  });
}

async function fetchSubscriptions() {
  const response = await fetch(`${SITE_ORIGIN}/api/push/subscriptions`, {
    headers: { 'x-push-key': PUSH_ADMIN_KEY },
  });
  if (response.status === 404) {
    warn(`the push API rejected the admin key (PUSH_ADMIN_KEY ≠ PUSH_KEY on ${SITE_ORIGIN})`);
    return null;
  }
  if (!response.ok) {
    warn(`subscriptions unavailable (${response.status}) — skipping`);
    return null;
  }
  const data = await response.json();
  return Array.isArray(data.subscriptions) ? data.subscriptions : null;
}

async function pruneDeadEndpoints(deadEndpoints) {
  for (let start = 0; start < deadEndpoints.length; start += PRUNE_CHUNK) {
    const chunk = deadEndpoints.slice(start, start + PRUNE_CHUNK);
    try {
      const response = await fetch(`${SITE_ORIGIN}/api/push/prune`, {
        method: 'POST',
        headers: { 'x-push-key': PUSH_ADMIN_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({ endpoints: chunk }),
      });
      if (!response.ok) warn(`prune answered ${response.status} — dead entries stay for next time`);
    } catch (error) {
      warn('prune failed — dead entries stay for next time:', error);
    }
  }
}

const vapidDetails = { subject: VAPID_SUBJECT, publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY };

async function send(payload) {
  const subscriptions = await fetchSubscriptions();
  if (!subscriptions) return;
  if (subscriptions.length === 0) {
    log('no subscribers yet — nothing to send');
    return;
  }

  let sent = 0;
  let failed = 0;
  const dead = [];
  for (const subscription of subscriptions) {
    try {
      await sendNotification(subscription, payload, { vapidDetails, TTL: 60 * 60 * 24 * 7 });
      sent += 1;
    } catch (error) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        // Gone for good: the browser discarded the subscription.
        dead.push(subscription.endpoint);
      } else {
        failed += 1;
        warn(`send failed (${error?.statusCode ?? 'no status'}):`, error?.message ?? error);
      }
    }
  }

  log(`sent ${sent} of ${subscriptions.length}${failed ? `, ${failed} failed` : ''}`);
  if (dead.length > 0) {
    log(`pruning ${dead.length} dead subscription(s)`);
    await pruneDeadEndpoints(dead);
  }
}

async function main() {
  if (process.argv.includes('--test')) {
    if (configProblems().length > 0) {
      for (const problem of configProblems()) warn(problem);
      warn('configure the push secrets first — see docs/push-notifications.md');
      process.exit(0);
    }
    log(`sending a test notice to every subscriber of ${SITE_ORIGIN}`);
    await send(
      JSON.stringify({
        title: 'ಕದಳಿ ವನಿತಾ ಸಮಾಜ',
        body: 'ಸುದ್ದಿ ಸೂಚನೆಯ ಪ್ರಯೋಗ — ಇದು ಪರೀಕ್ಷಾ ಸಂದೇಶ.',
        url: '/',
        tag: 'kadali-test',
      }),
    );
    return;
  }

  const problems = configProblems();
  if (problems.length > 0) {
    for (const problem of problems) warn(problem);
    warn('push notifications not configured — skipping (see docs/push-notifications.md)');
    process.exit(0);
  }

  // workflow_dispatch, the very first push of a branch, a force-push: none of
  // these can say "what changed", so none of them may announce. This is also
  // the dedupe against re-running the workflow by hand.
  if (!BEFORE_SHA || isZeroSha(BEFORE_SHA) || !AFTER_SHA || BEFORE_SHA === AFTER_SHA) {
    log('no before-commit to diff against — nothing to announce');
    process.exit(0);
  }

  const entries = newEntries(BEFORE_SHA, AFTER_SHA);
  if (entries.length === 0) {
    log('no new articles or events in this push — nothing to announce');
    process.exit(0);
  }
  log(`announcing ${entries.length} new entr${entries.length === 1 ? 'y' : 'ies'}:`, entries.map((e) => e.slug).join(', '));

  for (const entry of entries) {
    await send(payloadFor(entry));
  }
}

main().catch((error) => {
  console.error('[notify] crashed:', error);
  process.exit(1);
});
