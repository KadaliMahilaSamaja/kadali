/*
 * Kadali launch gate + push subscriptions — Cloudflare Pages advanced-mode
 * Worker.
 *
 * public/_worker.js is copied verbatim into dist/ by the Astro build; its
 * presence switches the Pages project into "advanced mode", so every request
 * that public/_routes.json does NOT exclude enters here, and static files
 * are reached only through env.ASSETS.fetch(). The _routes.json exclusions
 * (assets, images, icons, the CMS) stay on the free static path and never
 * invoke this Worker.
 *
 * The ceremony contract:
 *
 *   LAUNCH_KV binding missing        → fail OPEN, the site behaves exactly
 *                                      as before (arming = bind KV, redeploy)
 *   KV "launched" is not "open"      → curtain: every page serves
 *                                      /opening-soon.html as a 503 that
 *                                      nothing may cache; robots.txt becomes
 *                                      "Disallow: /" so crawlers stay out
 *   KV "launched" = "open"           → the site, untouched
 *
 * The guest's button on /launch POSTs /api/launch with the secret in the
 * x-launch-key header; the flag flips in KV and every curtain page (polling
 * /api/launch-status) opens itself within seconds. Fail-open is the
 * load-bearing decision: the gate must never be able to take the live site
 * down. Setup and the ceremony runbook: docs/launch-gate.md.
 *
 * The push API (/api/push/*) rides alongside the gate. Browsers POST their
 * push subscription into PUSH_KV (subscribe / unsubscribe, no secret needed
 * — a subscription address is anonymous and user-issued); the sending side
 * (GitHub Actions after each deploy, scripts/notify.mjs) lists and prunes
 * with the x-push-key secret. Its failure mode is inert: with no PUSH_KV or
 * no PUSH_KEY the endpoints answer 503 and the site carries on unchanged.
 * Runbook: docs/push-notifications.md.
 */

const KV_KEY = 'launched';
const CURTAIN = '/opening-soon.html';
const NO_STORE = 'no-store';

/* Push API limits: KV metadata (which carries the subscription for cheap
 * listing) must stay under 1024 bytes; the free plan allows ~50 subrequests
 * per invocation, hence the 40-endpoint prune chunk. */
const SUB_MAX_BYTES = 900;
const SUB_LIST_CAP = 500;
const PRUNE_CHUNK = 40;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': NO_STORE,
    },
  });
}

function methodNotAllowed(allow) {
  return new Response(null, { status: 405, headers: { allow } });
}

/** Small, defensive body reader: null on anything suspicious. */
async function readJson(request, maxChars) {
  try {
    const text = await request.text();
    if (text.length > maxChars) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** SHA-256 of a string, hex-encoded — the KV key for a subscription. */
async function sha256Hex(text) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constant-time comparison of a provided secret against the configured one.
 * Both sides are hashed first so the comparison length is fixed regardless
 * of input. No expected value configured → fail CLOSED for that feature.
 */
async function secretMatches(provided, expected) {
  if (!expected) return false;
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(String(provided))),
    crypto.subtle.digest('SHA-256', encoder.encode(String(expected))),
  ]);
  if (typeof crypto.subtle.timingSafeEqual === 'function') {
    return crypto.subtle.timingSafeEqual(a, b);
  }
  // Fallback for runtimes without the Workers extension (local tooling).
  const va = new Uint8Array(a);
  const vb = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

async function launchKeyOk(request, env) {
  return secretMatches(request.headers.get('x-launch-key') ?? '', env.LAUNCH_KEY);
}

async function pushKeyOk(request, env) {
  return secretMatches(request.headers.get('x-push-key') ?? '', env.PUSH_KEY);
}

/**
 * Only what a send needs, nothing that could identify a person: the endpoint
 * URL the browser generated and its encryption keys. Anything larger or
 * stranger is refused.
 */
function isValidSubscription(sub) {
  return (
    !!sub &&
    typeof sub.endpoint === 'string' &&
    sub.endpoint.startsWith('https://') &&
    sub.endpoint.length <= 500 &&
    !!sub.keys &&
    typeof sub.keys.p256dh === 'string' &&
    sub.keys.p256dh.length > 0 &&
    sub.keys.p256dh.length <= 200 &&
    typeof sub.keys.auth === 'string' &&
    sub.keys.auth.length > 0 &&
    sub.keys.auth.length <= 100
  );
}

/** The stored record: subscription + when it arrived. */
function subscriptionRecord(sub) {
  return { endpoint: sub.endpoint, keys: sub.keys, at: new Date().toISOString() };
}

/**
 * Read the gate. Fail-open on a missing binding (not armed, or a branch
 * preview environment) and on any KV error — the curtain is a celebration,
 * never a dependency of the live site.
 */
async function readGate(env) {
  try {
    if (!env.LAUNCH_KV) return { armed: false, open: true, since: null };
    const { value, metadata } = await env.LAUNCH_KV.getWithMetadata(KV_KEY);
    if (value === 'open') {
      return { armed: true, open: true, since: (metadata && metadata.at) || null };
    }
    return { armed: true, open: false, since: null };
  } catch {
    return { armed: false, open: true, since: null };
  }
}

/** Branch previews (<branch>.kadali-coo.pages.dev) stay open for team checks. */
function isBranchPreview(url) {
  return url.hostname.endsWith('.kadali-coo.pages.dev');
}

/** Paths served even while the curtain is closed. */
function isExempt(path) {
  return path === '/launch' || path.startsWith('/launch/') || path.startsWith('/admin');
}

/**
 * The curtain: the holding page as a 503 that nothing may cache, with a
 * noindex signal for anything that ignores robots.txt.
 */
async function serveCurtain(env, url) {
  try {
    const asset = await env.ASSETS.fetch(new Request(new URL(CURTAIN, url.origin)));
    const headers = new Headers(asset.headers);
    headers.set('cache-control', NO_STORE);
    headers.set('x-robots-tag', 'noindex, nofollow');
    headers.set('retry-after', '300');
    headers.delete('etag');
    return new Response(asset.body, { status: 503, headers });
  } catch {
    // The holding page itself is somehow missing — a bare bilingual fallback
    // beats a Cloudflare error page.
    return new Response(
      '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex">' +
        '<title>ಉದ್ಘಾಟನೆ ಶೀಘ್ರವೇ · Opening shortly</title>' +
        '<body style="font-family:system-ui;text-align:center;padding:4rem">' +
        '<h1>ಉದ್ಘಾಟನೆ ಶೀಘ್ರವೇ</h1><h2>Opening shortly</h2>' +
        '<p>ಈ ಪುಟವನ್ನು ಮುಚ್ಚಬೇಡಿ — ಉದ್ಘಾಟನೆಯಾದ ಕೂಡಲೇ ತಾನಾಗಿಯೇ ತೆರೆದುಕೊಳ್ಳುತ್ತದೆ.</p>' +
        '<p>Keep this page open — it opens by itself the moment the launch happens.</p>',
      {
        status: 503,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': NO_STORE,
          'x-robots-tag': 'noindex, nofollow',
          'retry-after': '300',
        },
      },
    );
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    /* ——— launch API: reachable in every state, handled first so the gate
       never delays or blocks it ——— */
    if (path === '/api/launch-status') {
      if (request.method !== 'GET') return methodNotAllowed('GET');
      return json(await readGate(env));
    }
    if (path === '/api/launch' || path === '/api/reset') {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      if (!(await launchKeyOk(request, env))) {
        // Distinguish "the admin never set the secret" (503) from "wrong
        // key" (404 — no confirmation that the endpoint exists at all).
        if (!env.LAUNCH_KEY) return json({ ok: false, error: 'not-configured' }, 503);
        return new Response(null, { status: 404 });
      }
      if (!env.LAUNCH_KV) return json({ ok: false, error: 'not-armed' }, 503);
      const open = path === '/api/launch';
      try {
        await env.LAUNCH_KV.put(KV_KEY, open ? 'open' : 'closed', {
          metadata: { at: new Date().toISOString() },
        });
      } catch {
        return json({ ok: false, error: 'kv-write-failed' }, 503);
      }
      return json({ ok: true, open, since: new Date().toISOString() });
    }
    /* ——— push API: subscriptions in PUSH_KV. Subscribe/unsubscribe are the
       visitor's own, anonymous; list/prune are the sender's, secret-keyed.
       Like the launch API, handled before the gate in every state. ——— */
    if (path === '/api/push/subscribe') {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      if (!env.PUSH_KV) return json({ ok: false, error: 'not-configured' }, 503);
      const body = await readJson(request, 2000);
      if (!isValidSubscription(body)) return json({ ok: false, error: 'bad-subscription' }, 400);
      const record = subscriptionRecord(body);
      const value = JSON.stringify(record);
      // The record rides in the metadata (≤1024 bytes in KV) so listing is a
      // single call; the value keeps a full copy for the rare too-big record.
      const metadata =
        value.length <= SUB_MAX_BYTES
          ? { at: record.at, sub: record }
          : { at: record.at };
      try {
        await env.PUSH_KV.put(await sha256Hex(record.endpoint), value, { metadata });
      } catch {
        return json({ ok: false, error: 'kv-write-failed' }, 503);
      }
      return json({ ok: true });
    }

    if (path === '/api/push/unsubscribe') {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      if (!env.PUSH_KV) return json({ ok: false, error: 'not-configured' }, 503);
      const body = await readJson(request, 1000);
      if (!body || typeof body.endpoint !== 'string' || !body.endpoint.startsWith('https://')) {
        return json({ ok: false, error: 'bad-endpoint' }, 400);
      }
      try {
        const deleted = await env.PUSH_KV.delete(await sha256Hex(body.endpoint));
        return json({ ok: true, deleted });
      } catch {
        return json({ ok: false, error: 'kv-write-failed' }, 503);
      }
    }

    if (path === '/api/push/subscriptions') {
      if (request.method !== 'GET') return methodNotAllowed('GET');
      if (!env.PUSH_KEY) return json({ ok: false, error: 'not-configured' }, 503);
      if (!(await pushKeyOk(request, env))) {
        // Wrong key: a bare 404, no confirmation the endpoint exists.
        return new Response(null, { status: 404 });
      }
      if (!env.PUSH_KV) return json({ ok: false, error: 'not-armed' }, 503);
      try {
        const subscriptions = [];
        let cursor;
        let truncated = false;
        do {
          const page = await env.PUSH_KV.list({ limit: 1000, cursor });
          for (const key of page.keys) {
            if (subscriptions.length >= SUB_LIST_CAP) {
              truncated = true;
              break;
            }
            // Metadata carries the record (fast path); fall back to a get.
            if (key.metadata && key.metadata.sub) {
              subscriptions.push(key.metadata.sub);
            } else {
              const value = await env.PUSH_KV.get(key.name);
              if (value) {
                try {
                  subscriptions.push(JSON.parse(value));
                } catch {
                  /* a mangled record is skipped, never fatal */
                }
              }
            }
          }
          cursor = page.list_complete ? undefined : page.cursor;
        } while (cursor && subscriptions.length < SUB_LIST_CAP);
        return json({ ok: true, subscriptions, truncated });
      } catch {
        return json({ ok: false, error: 'kv-read-failed' }, 503);
      }
    }

    if (path === '/api/push/prune') {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      if (!env.PUSH_KEY) return json({ ok: false, error: 'not-configured' }, 503);
      if (!(await pushKeyOk(request, env))) {
        return new Response(null, { status: 404 });
      }
      if (!env.PUSH_KV) return json({ ok: false, error: 'not-armed' }, 503);
      const body = await readJson(request, 4000 + PRUNE_CHUNK * 600);
      if (
        !body ||
        !Array.isArray(body.endpoints) ||
        body.endpoints.length === 0 ||
        body.endpoints.length > PRUNE_CHUNK ||
        body.endpoints.some((e) => typeof e !== 'string' || !e.startsWith('https://'))
      ) {
        return json({ ok: false, error: 'bad-endpoints' }, 400);
      }
      try {
        let deleted = 0;
        for (const endpoint of body.endpoints) {
          if (await env.PUSH_KV.delete(await sha256Hex(endpoint))) deleted += 1;
        }
        return json({ ok: true, deleted, remaining: body.endpoints.length - deleted });
      } catch {
        return json({ ok: false, error: 'kv-write-failed' }, 503);
      }
    }

    if (path.startsWith('/api/')) return new Response(null, { status: 404 });

    /* ——— the gate ——— */
    if (isBranchPreview(url)) return env.ASSETS.fetch(request);
    const gate = await readGate(env);
    if (gate.open) return env.ASSETS.fetch(request);

    // Operator bypass on any path: the x-launch-key header (curl checks,
    // pre-launch screenshots). A browser navigation can never carry a custom
    // header, so it never reaches ordinary visitors.
    if (await launchKeyOk(request, env)) return env.ASSETS.fetch(request);
    if (isExempt(path)) return env.ASSETS.fetch(request);

    // While closed, keep crawlers out entirely; the real robots.txt returns
    // with the launch.
    if (path === '/robots.txt') {
      return new Response('User-agent: *\nDisallow: /\n', {
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': NO_STORE,
        },
      });
    }

    return serveCurtain(env, url);
  },
};
