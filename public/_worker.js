/*
 * Kadali launch gate — Cloudflare Pages advanced-mode Worker.
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
 */

const KV_KEY = 'launched';
const CURTAIN = '/opening-soon.html';
const NO_STORE = 'no-store';

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

/**
 * Constant-time comparison of the provided key against the configured one.
 * Both sides are hashed first so the comparison length is fixed regardless
 * of input. No LAUNCH_KEY configured → fail CLOSED: nobody can launch.
 */
async function launchKeyOk(request, env) {
  const expected = env.LAUNCH_KEY;
  if (!expected) return false;
  const provided = request.headers.get('x-launch-key') ?? '';
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
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
