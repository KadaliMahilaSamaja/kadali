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
- Branch previews (`<branch>.kadali.pages.dev`) are never gated — the team
  can inspect the real site pre-launch without touching the flag.
- The **service worker is safe by construction**: page navigations are
  network-first, 5xx responses are never cached, and `/api/*` is skipped
  entirely — an installed PWA shows the curtain while closed and the real
  site after launch, with no stale copy in between.

## One-time setup (arming the gate)

Do this a few days before the ceremony. Until these steps are done, the site
behaves exactly as before — deploying the code is safe at any time.

1. **Create the KV namespace** — Cloudflare dashboard → *Storage & Databases →
   KV* → *Create namespace*, name it e.g. `kadali-launch`.
2. **Bind it to the Pages project** — *Workers & Pages → kadali → Settings →
   Bindings (Production tab)* → *Add → KV namespace*: variable name
   **`LAUNCH_KV`**, namespace `kadali-launch`. (Repeat in the Preview tab only
   if you want branch previews gated too — usually not.)
3. **Set the secret.** Generate a strong key (e.g. `openssl rand -hex 24`, or
   your password manager), then add it as an encrypted environment variable:
   *Settings → Environment variables (Production tab)* → *Add* → type
   **Secret**, name **`LAUNCH_KEY`**, paste the key. The CLI equivalent is
   `npx wrangler pages secret put LAUNCH_KEY --project-name kadali`.
4. **Redeploy once** — Pages bindings and variables apply on the *next*
   deployment: GitHub → *Actions → Deploy to Cloudflare Pages → Run workflow*.
   When it finishes, kadali.org shows the curtain.
5. **Verify.** Open kadali.org → curtain. Open `/admin` → CMS sign-in works
   as always. Open `https://kadali.org/launch` → the status pill says
   "ಪರದೆ ಮುಚ್ಚಿದೆ / Curtain closed" and there is no "not armed" warning.

⚠️ Pages bindings and environment variables take effect on the next deploy —
if the curtain doesn't appear after step 2, it's almost always a missing
redeploy.

## Rehearsal (day before)

Open the launch link — the key travels in the URL **fragment**, which browsers
never send to any server, and the page scrubs it from the address bar at once:

```
https://kadali.org/launch#k=<LAUNCH_KEY>
```

1. The pill should read "Curtain closed". Press and **hold** the big button
   for three seconds (the turmeric ring fills; releasing early cancels).
2. Status flips to "ತೆರೆದಿದೆ!". Every open curtain tab opens itself within a
   few seconds. Click around the real site — it is the finished deployment.
3. Under *ಪೂರ್ವಾಭ್ಯಾಸ / Rehearsal*, hold **ಪರದೆ ಮುಚ್ಚಿ / Close the curtain**
   (~1.2 s). Confirm the curtain is back on kadali.org.
4. Repeat until comfortable. Also try opening `/launch` **without** the
   fragment: it asks for the key in a field (memory of the tab only).

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
2. Before handover, confirm the pill says "Curtain closed" and no warnings.
3. The guest presses and holds for three seconds. The audience's curtain
   pages open themselves in seconds (everyone in the hall shares one
   Cloudflare colo); elsewhere in the world KV propagation takes at most
   ~60 s, which the polling quietly covers.
4. If anything odd happens, `/api/reset` (hold the rehearsal button) puts the
   curtain back instantly.

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
