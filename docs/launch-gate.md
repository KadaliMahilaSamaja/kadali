# Launch gate — the ceremony curtain

How the website stays hidden behind a bilingual "ಉದ್ಘಾಟನೆ ಶೀಘ್ರವೇ / Opening
shortly" curtain until one of the guests presses the launch button on stage —
and how the whole thing is armed, rehearsed, and performed.

```
                     ┌─ flag not "open" ──► curtain (/opening-soon.html, 503)
visitor ─► kadali.org│                     pages poll the status and open themselves
                     └─ flag "open" ─────► the real site

guest presses the big button on /launch (hold 3 s)
   └─► POST /api/launch (x-launch-key header) ─► KV flag flips ─► curtains open
```

## How it works

- **The site is fully deployed before the ceremony.** The curtain is not a
  placeholder build — it is a flag at Cloudflare's edge in front of a finished
  site. Nothing is built or deployed during the event; the on-stage action is
  one HTTP request, so nothing can fail in front of the audience.
- `public/_worker.js` is a Cloudflare Pages **advanced-mode Worker**: every
  request that `public/_routes.json` does not exclude enters it. Static
  assets, images, icons and the CMS (`/admin/*`) are excluded there — they
  stay on the free static path, are never gated, and never invoke the Worker.
- The gate reads one key from the `LAUNCH_KV` KV namespace (bound in the
  Cloudflare dashboard): value `open` → site; anything else (including unset)
  → curtain. Every HTML page is then served from `/opening-soon.html` as a
  **503** with `Cache-Control: no-store`, `X-Robots-Tag: noindex`, and
  `Retry-After: 300`.
- While the curtain is closed, `robots.txt` serves `Disallow: /` so crawlers
  never enter; the real robots.txt comes back with the launch.
- Curtain pages poll `GET /api/launch-status` every 4 s. When the flag flips,
  a leaf-green veil rises and the page reloads **itself** — whatever URL the
  visitor holds (homepage or a shared deep link) comes back as the real page.
  Nobody has to refresh anything.
- `POST /api/launch` (open) and `POST /api/reset` (close again — rehearsal)
  require the secret in the `x-launch-key` header, compared timing-safely
  (both sides SHA-256 hashed, then `crypto.subtle.timingSafeEqual`).
- **The gate fails open.** A missing `LAUNCH_KV` binding or a KV error means
  "not armed" and the site serves normally. The curtain is a celebration, not
  a dependency — it must never be able to take the live site down.
- Branch previews (`<branch>.kadali-coo.pages.dev`) are never gated — the team
  can inspect the real site pre-launch without touching the flag. The
  production alias `kadali-coo.pages.dev` (no branch prefix) **is** gated.
- The **service worker is safe by construction**: page navigations are
  network-first, 5xx responses are never cached, and `/api/*` is skipped
  entirely — an installed PWA shows the curtain while closed and the real
  site after launch, with no stale copy in between.

## Setup (completed 2026-11-18, before the 19 Nov unveiling)

Everything below is already in place; recorded here so it can be rotated or
rebuilt:

1. **KV namespace** `kadali-launch` (ID `33e614c671cd42948f9ab75d08bb2393`) in
   the KadaliVanitaSamaja Cloudflare account, created with
   `wrangler kv namespace create kadali-launch`.
2. **Secret** `LAUNCH_KEY` set on the production environment of the Pages
   project with `wrangler pages secret put LAUNCH_KEY --project-name kadali`
   (secrets persist across deployments and are never in the repo).
3. **Binding** declared in `wrangler.toml` (`LAUNCH_KV` → the namespace), so
   every deployment — GitHub Actions or manual — arms the gate automatically.
4. Deployed; production verified: curtain on kadali.org, `/admin` working,
   `/launch` reachable, robots.txt serving `Disallow: /`.

To **rotate the key**: generate a new one (`openssl rand -hex 24`), run
`wrangler pages secret put LAUNCH_KEY --project-name kadali` again, and update
the ceremony link — no redeploy needed.

To **disarm permanently**: remove the `[[kv_namespaces]]` block from
`wrangler.toml`, commit, and let the next deploy run. The Worker then fails
open and the site is a plain static one again.

⚠️ Pages bindings and environment variables take effect on the next deploy —
a config change without a redeploy does nothing.

## Maintainer controls (the collapsible)

The ceremony page shows no machinery to guests. Your controls — the
**ಪರದೆ ಮುಚ್ಚಿ / Close the curtain** chip, the key field, the **hold
seconds** for the big button (1–10, saved in that browser's localStorage)
and the gate status line (checking / Curtain closed / It is open / Still
reaching, plus the "Opened at" stamp) — live in the quiet
**ನಿರ್ವಹಣೆ / maintainer** strip at the foot of the page, collapsed by
default. Open it any of these ways (never persists across loads):

- click the **ನಿರ್ವಹಣೆ / maintainer** strip itself, **or**
- press the **O** key on the page, **or**
- tap the Akka Mahadevi emblem at the top five times quickly (phone), **or**
- open `/launch?ops` (or `/launch#ops`) — also surfaces the not-armed
  diagnostic when the KV binding is missing.

## Rehearsal (day before)

Open the launch link — the key travels in the URL **fragment**, which browsers
never send to any server, and the page scrubs it from the address bar at once:

```
https://kadali.org/launch#k=<LAUNCH_KEY>
```

1. The page shows the big "ತೆರೆಯಿರಿ" disc. Check the gate — expand the
   **ನಿರ್ವಹಣೆ** strip (the status line should read "Curtain closed") or run
   `curl -s https://kadali.org/api/launch-status` → `"open":false`.
   Press and **hold** the big button for three seconds (the turmeric ring
   fills; releasing early cancels).
2. The page celebrates (the glow washes the screen, petals fall) and then
   **opens the homepage itself** after ~2 seconds. Every open curtain tab
   opens itself within a few seconds. Press **Back** to return to the
   console — click around the real site; it is the finished deployment.
3. Expand the **ನಿರ್ವಹಣೆ / maintainer** strip at the foot (click it, or
   press **O**) and hold **ಪರದೆ ಮುಚ್ಚಿ / Close the curtain** (~1.2 s).
   Confirm the curtain is back on kadali.org.
4. Repeat until comfortable. Also try opening `/launch` **without** the
   fragment: trying to open asks for the key, and the field unfolds only
   then (memory of the tab only). The page itself shows no key machinery
   otherwise.

Quick checks from a terminal, any time:

```sh
curl -s https://kadali.org/api/launch-status            # {"armed":true,"open":false,...}
curl -s -X POST -H "x-launch-key: <KEY>" https://kadali.org/api/launch
curl -s -X POST -H "x-launch-key: <KEY>" https://kadali.org/api/reset
curl -s -H "x-launch-key: <KEY>" https://kadali.org/about -o /dev/null -w '%{http_code}\n'
                                                        # 200 — header bypasses the curtain
                                                        # (handy for pre-launch screenshots)
```

## Ceremony day

1. Print a QR code (or short link card) with `https://kadali.org/launch#k=<KEY>`
   for the guest. Share the key only with people who need it (password
   manager / private message) — keep the card on stage.
2. Before handover, confirm the gate is closed — expand the
   **ನಿರ್ವಹಣೆ** strip on `/launch` (status: "Curtain closed") or run
   `curl -s https://kadali.org/api/launch-status` → `"open":false`.
3. The guest presses and holds for three seconds (the glow grows with the
   hold and washes the screen at confirm). The stage page celebrates and
   opens the homepage itself; the audience's curtain pages open
   themselves in seconds (everyone in the hall shares one Cloudflare
   colo); elsewhere in the world KV propagation takes at most ~60 s,
   which the polling quietly covers.
4. If anything odd happens, `/api/reset` puts the curtain back instantly —
   open the **ನಿರ್ವಹಣೆ / maintainer** strip at the foot of `/launch`
   (click it, press **O**, or five taps on the emblem) and hold the
   **Close the curtain** chip.

## After the ceremony

Two options, both safe:

- **Leave it armed and open** (default). The Worker just passes everything
  through to static assets; HTML navigations keep invoking it (~1 KV read per
  page view, far under the free 100 k/day). `/api/reset` remains available if
  the site ever needs to be hidden again.
- **Disarm completely**: delete the `LAUNCH_KV` binding and the `LAUNCH_KEY`
  variable from the Pages project, then redeploy once. The Worker fails open
  and the site is a plain static one again — the files can stay in the repo
  harmlessly.

## Reference

| Endpoint | Auth | Effect |
| --- | --- | --- |
| `GET /api/launch-status` | none | `{ armed, open, since }` |
| `POST /api/launch` | `x-launch-key: LAUNCH_KEY` | opens the site |
| `POST /api/reset` | `x-launch-key: LAUNCH_KEY` | closes the curtain (rehearsal) |

- **Exempt while closed:** `/launch`, `/admin/*`, `/api/*`, branch previews,
  and any request carrying the valid `x-launch-key` header.
- **Never gated:** `/_astro/*`, `/images/*`, `/icons/*`, `/favicon.svg`,
  `/manifest.webmanifest`, `/offline.html`, `/sw.js`, sitemaps — excluded
  from the Worker in `public/_routes.json`, which also keeps invocation
  counts (and free-tier usage) low.
- **KV values:** key `launched` → `open` (site visible) or `closed` (curtain);
  unset means curtain. The ISO timestamp of the last flip rides in the KV
  metadata and is shown on `/launch`.
- **Status codes:** curtain = `503` + `no-store` + `X-Robots-Tag: noindex`;
  wrong key on the API = `404`; secret not configured on the server = `503
  {"error":"not-configured"}`; gate not armed = `503 {"error":"not-armed"}`.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Curtain never appears after binding KV | Bindings apply on the next deploy — run the workflow once. |
| `/launch` shows "not armed" warning | `LAUNCH_KV` binding missing on the **Production** tab. |
| Hold completes, "key not accepted" | Secret mismatch — re-set `LAUNCH_KEY`, make sure the `#k=` value matches. |
| `/launch` shows "LAUNCH_KEY is not set on the server" | The secret variable is missing (step 3 of setup). |
| Some distant visitor still sees the curtain after launch | KV propagation ≤ 60 s; the page opens itself — or a manual refresh. |
| Old installed PWA shows the curtain | Correct (network-first navigations); it opens with the launch. |
| Curtain appears under `npm run dev` | It doesn't — the gate only exists on the deployed Pages project. To test the real routing locally: `npx wrangler pages dev dist --kv LAUNCH_KV --binding "LAUNCH_KEY=testkey123"`. |

## Notes and caveats

- The gate protects **kadali.org only**. The GitHub repository is public, so
  content is technically readable there before launch — that is already the
  documented model ("drafts are never confidential").
- The CMS (`/admin`) keeps working while the curtain is closed, so launch-day
  content can be published the moment the site opens.
- No cookies are involved anywhere — the key lives in the URL fragment and in
  tab memory, the language preference stays in localStorage. The privacy
  policy stands.
