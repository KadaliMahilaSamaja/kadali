# News notifications — web push

When a **new article or event** is published to `main`, visitors who opted in
get a browser push notification with the entry's title and a deep link. Edits
to already-published entries stay silent (no pings for typo fixes), and draft
articles wait until they are really published. Everything runs on free tiers:
Cloudflare Workers + KV, GitHub Actions (free on the public repo), and the
browsers' own push services (Google/Apple/Mozilla) — no paid push provider.

```
member publishes in Sveltia ─► merge to main ─► deploy.yml
   ├─ npm run build ─► wrangler pages deploy dist
   └─ node scripts/notify.mjs
        diff BEFORE_SHA..AFTER_SHA ─► new articles/events (skip draft: true)
        GET  /api/push/subscriptions (x-push-key) ─► PUSH_KV list
        web-push send ─► browser push service ─► visitor's sw.js shows it
        POST /api/push/prune ─► dead (404/410) endpoints deleted
```

## How it works

- **Opt-in only.** The `PushPrompt.astro` card (same manners as the install
  banner: waits for the language gate and the install banner, dismissal
  remembered in localStorage) asks once; the footer carries a permanent
  "get notified" line that summons the card back. Browsers without push —
  iOS Safari unless the site is on the Home Screen (Apple's rule), private
  windows, old engines — never see either; pure feature detection.
- **Subscriptions live in `PUSH_KV`** (second namespace in `wrangler.toml`).
  `POST /api/push/subscribe` in `public/_worker.js` stores the browser's
  anonymous subscription (endpoint URL + encryption keys — no name, no
  email, nothing identifying) keyed by the SHA-256 of the endpoint. The
  record rides in the KV *metadata* (≤ 900 bytes) so listing is one call.
- **Sending never happens in the Worker.** `scripts/notify.mjs` (Node, uses
  the `web-push` package) runs on Actions after each deploy: it diffs
  `github.event.before..github.sha`, builds one small JSON payload per new
  entry (`{ title, body, url, tag }`, Kannada body, title from frontmatter),
  fetches the subscription list through the secret-keyed endpoint, sends,
  and prunes endpoints the push services report gone (404/410).
- **Admin endpoints** (`GET /api/push/subscriptions`, `POST /api/push/prune`)
  require the `x-push-key` secret (same timing-safe comparison as the launch
  gate); a wrong key gets a bare 404. Prune takes at most 40 endpoints per
  call — the free plan's subrequest ceiling — and the script chunks around
  that.
- **Best-effort, like the curtain is fail-open.** Missing secrets, an
  unreachable origin or a push-service outage are logged and exit 0 (plus
  `continue-on-error` on the step): a push hiccup must never fail a deploy
  that already succeeded. A script bug crashes loudly instead.
- The worker's `push`/`notificationclick` handlers (`public/sw.js`) show the
  notice and focus (or open) the target page. Payloads are tiny and no-cache
  questions don't arise, so `sw.js`'s `VERSION` needed no bump.
- **Privacy:** the page's promise is kept — an anonymous subscription
  address is the only thing stored, the policy section "News notifications"
  discloses it (2026-11-25 revision).

## Setup (one-time, not yet done)

Everything below is operator work — Cloudflare dashboard/wrangler and GitHub
secrets are outside the repo. In order:

1. **VAPID keys** (identify the sender to push services):
   `npx web-push generate-vapid-keys`
   → paste the **public** key into `VAPID_PUBLIC_KEY` in
   `src/components/PushPrompt.astro` (it is public by nature; until pasted,
   the whole feature sleeps quietly). The **private** key only ever lives in
   GitHub secrets.
2. **KV namespace**: `wrangler kv namespace create kadali-push`
   → paste the ID into `wrangler.toml`'s `PUSH_KV` block (replacing
   `REPLACE_WITH_NAMESPACE_ID`).
3. **Worker secret**: pick a random hex (`openssl rand -hex 24`) and set it
   on the Pages production environment:
   `wrangler pages secret put PUSH_KEY --project-name kadali`
   (same value as the next step's `PUSH_ADMIN_KEY`; rotation = rerun the
   command).
4. **GitHub secrets** on `KadaliMahilaSamaja/kadali`:
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
   (a `mailto:contact@kadali.org` style contact for the push services) and
   `PUSH_ADMIN_KEY` (same value as step 3).
5. **Deploy** (push to `main` or `workflow_dispatch`) — Pages bindings and
   secrets take effect on the next deploy only.

## Testing

Local, no deploy needed:

```sh
npm run build
npx wrangler pages dev dist --kv PUSH_KV --binding "PUSH_KEY=testkey123"
# in another shell — the admin endpoints:
curl -s localhost:8788/api/push/subscriptions                        # → 404 (no key)
curl -s -H "x-push-key: testkey123" localhost:8788/api/push/subscriptions
curl -s -X POST -H "content-type: application/json" \
     -d '{"endpoint":"https://push.example.com/3/device/abc","keys":{"p256dh":"x","auth":"y"}}' \
     localhost:8788/api/push/subscribe
# real browser subscription: open localhost:8788 (a PROD build, so the
# service worker registers; localhost counts as a secure context), tap the
# card, grant permission
# then send to every subscriber with the same VAPID pair:
VAPID_PUBLIC_KEY=… VAPID_PRIVATE_KEY=… PUSH_ADMIN_KEY=testkey123 \
  SITE_ORIGIN=http://localhost:8788 node scripts/notify.mjs --test
```

In production: `node scripts/notify.mjs --test` against kadali.org, then a
real publish through the CMS — the Actions log names the entries it found.

## Limits and troubleshooting

- Free-tier ceilings: KV 1k writes/day (subscribes), 1k deletes/day (prune),
  100k Worker requests/day; the subscription list is capped at 500. All far
  beyond a club's audience; the first that could ever bite is KV writes.
- "Nothing announces" after a publish → check the Actions log for the
  `[notify]` lines: an empty diff (`M` not `A`), a `draft: true` skip and a
  missing `BEFORE_SHA` (manual rerun) are all deliberate no-ops.
- `subscriptions unavailable (404)` in the log → `PUSH_ADMIN_KEY` (GitHub)
  and `PUSH_KEY` (Pages secret) disagree.
- `503 not-configured` from the push API → the `PUSH_KV` binding or the
  secret is missing on that environment; redeploy after fixing `wrangler.toml`.
- A subscriber who tapped "block" in the browser shows `denied` only on the
  card; the stale endpoint dies silently at the next send and is pruned.
