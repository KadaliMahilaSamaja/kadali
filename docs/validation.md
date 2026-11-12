# Kadali Validation Report — Sveltia CMS critical requirements
**VERDICT: PASS — build the website on Sveltia CMS.** All three gate requirements validated with sources. Caveats carried into delivery: image-transform config is mandatory (shipped), CMS UI is English-only (guide uses English + Kannada labels), real-Android device test remains a manual acceptance step. Architecture decisions in each section below.

Date: 2026-11-11. All claims source-linked.

## 1. GitHub permissions & repository access

**Requirement:** members must publish without GitHub admin rights; understand CMS-role vs repo-role gap.

**Findings (InfraResearch, verified):**
- GitHub repo roles are repo-wide: Read / Triage / **Write** / Maintain / Admin. **No role maps to "can only edit content files"**; path-scoped custom roles exist only on Enterprise Cloud. Sveltia requires Write/Maintain/Admin to sign in (read-only only works via Open Authoring forks). [1][2]
- Personal repos can't even grant read-only collaborators on private repos → **club must use a GitHub organization**.
- Editorial workflow: each entry = branch `cms/<collection>/<slug>` + PR; publish = merge. Editors still need Write to create branches. On a protected branch, Simple workflow goes read-only, Editorial keeps working. [3]
- **Documented limitation (explicit):** a member with Write is *always* able to bypass the CMS and edit any repo file directly on GitHub. Mitigation = blast-radius control, not prevention: single repo contains only website + content (no secrets in repo; deploy creds live in Cloudflare), `main` protected with required review so nothing reaches the public site un-reviewed.
- Branch protection + required reviews: **free for public org repos** (private needs paid). Draft branches are publicly readable in a public repo → drafts are non-confidential. Acceptable for a club; noted in docs.

**Decision:** single public org repo `KadaliMahilaSamaja/kadali` (website + content + admin). Members = Write. `main` protected, 1 required review. Editorial workflow ON for content collections.

## 2. Zero-cost quotas

- Cloudflare Pages Free: 500 builds/mo, 1 concurrent, 20k files, 25 MiB/file, unlimited bandwidth/static requests, 100 custom domains. [4]
- GitHub Free: public repo, unlimited collaborators; repo guidance <1 GB ideal, <5 GB max recommended; 100 MiB/file hard cap. No LFS in Sveltia GitHub backend. [5][2]
- **Build-quota hazard:** editorial drafts push `cms/*` branches; Pages preview-builds non-prod branches by default → configure branch build controls to skip `cms/**` (or previews off) to protect the 500/mo budget.
- Cloudflare Workers free plan hosts the OAuth authenticator (sveltia-cms-auth): 100k req/day — far above club needs. [6]

**Decision:** one Pages project (website + `/admin`), builds from `main` only. `admin.kadali.org` → simple Cloudflare redirect to `kadali.org/admin` (friendly URL preserved; no second project needed — documented Sveltia pattern is hosting admin on the site itself [7]).

## 3. Image storage

- Internal repo storage with **built-in client-side transformations**: uploads auto-converted to WebP, max 2048px, quality 80–85; plus `max_file_size` guard. [8] Typical phone photo 3–8 MB → ~200–400 KB stored.
- At ~300 KB/photo, thousands of photos stay under the 1 GB guidance for years. Zero setup for members.
- Upgrade path if gallery grows huge: Sveltia's native **Cloudflare R2** integration (free 10 GB, zero egress) — but each member must enter the R2 secret key in their browser on first use [9] → friction; not v1.
- Cloudflare Images has no free storage tier (paid only) — rejected. [10]

**Decision:** internal storage, `media_folder: public/images/uploads`, transformations `raster_image: {format: webp, quality: 80, width: 2048, height: 2048}`, `slugify_filename: true`, generous `max_file_size` (15 MB) so large phone photos pass the gate and shrink via transform. R2 upgrade documented in admin guide.

## 4. Authentication (VERIFIED — AuthResearch + orchestrator cross-check; section updated 2026-11-12)

**Finding:** No hosted authentication service exists. The authenticator author states it is "not offered as SaaS" due to legal/privacy/security liability [12]. Prior assumption of a hosted auth service at auth.sveltia.app was wrong.

**Supported methods for GitHub (verified [2][12]):**
1. **Access token (PAT)** — fine-grained, Contents+Pull-Requests RW. Too technical for members; good for admins/testing.
2. **Authorization flow via self-hosted sveltia-cms-auth on Cloudflare Workers (free)** — correct choice for non-technical members. The current README registers the worker as a **GitHub App** (see below; updated 2026-11-12).
3. PKCE — GitLab only; GitHub blocked on GitHub API support.
4. Netlify OAuth — N/A (not on Netlify).

**Recommended setup — GitHub App (README verified 2026-11-12):** sveltia-cms-auth now registers the worker as a GitHub App instead of a classic OAuth App. The app is installed only on the selected repositories — for Kadali, the single club repo — with permissions Contents read/write + Pull requests read/write (+ Metadata read-only, selected automatically). User access tokens expire after 8 hours; the CMS refreshes them automatically through the worker, and the refresh token stays valid for 6 months of no use before a fresh sign-in is needed. This removes the scope limitation recorded below: a member's token grants access only to the installed repo, not to every repo she can access. Two documented consequences: `auth_scope` has no effect with a GitHub App (access is determined by the app's permissions and installation, not OAuth scopes), and Open Authoring is not supported (the app would have to be installed on each contributor's fork — not used here).

**Historical note (originally verified 2026-11-11):** the earlier flow used a classic OAuth App whose `repo` scope = read/write to every repo the member can access [11][13]; GitHub Apps were then unsupported — issue #15 proposed them post-1.0 [11]. Classic OAuth apps still work with the worker but are no longer documented by the project (the README includes a migration guide). The historical mitigation (exactly one repo in the club org) is no longer required but remains good practice.

**Setup (one-time, admin):** deploy worker (1-click), register the GitHub App per current README (pre-filled link, callback `<worker>/callback`, Contents + Pull requests RW, install on the club repo only), set `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` (encrypted) + `ALLOWED_DOMAINS` = site hostname (anti-abuse: token released only to our origin), `base_url: <worker-url>` in config.yml, `auth_methods: [oauth]` to hide PAT sign-in.

**Unauthorized access:** CMS is a public SPA but all content operations require a GitHub token; users without the org Write role cannot sign in [2]. Unauthenticated visitors get the login screen only.

**Decision:** sveltia-cms-auth on Workers + GitHub App (per current README) + `auth_methods: [oauth]` + `ALLOWED_DOMAINS` lockdown. Secrets live only in Worker env vars — never in the repo.

## 5. Mobile / WYSIWYG (VERIFIED — MobileResearch, source-code level)

**WYSIWYG: ADEQUATE.** Markdown fields get a Lexical-based rich text editor: bold/italic/strikethrough, headings, bulleted + numbered lists, links, images, blockquotes, code, tables. Responsive CSS below 768px, touch-sized toolbar, no keyboard-only interactions; no open Android/touch issues in the tracker. [14][15]

**Image upload: ADEQUATE WITH CONFIG (already applied).** Mobile opens the native file picker (gallery/camera) directly. Client-side transformations (resize/WebP/quality) exist but are **opt-in** — without config, full-size phone photos land in the repo. Our config.yml sets `media_libraries.default.config.transformations` (webp, 2048px, q80) + 15 MB pre-transform gate. [8][15]

**Mobile UX: ADEQUATE, one caveat.** Fully responsive, PWA installable, swipe navigation, ~30px touch targets. Caveat: Sveltia's own package notes the UI is "not yet optimized for small screens" — best on tablets, usable on phones. Real-Android acceptance test remains a required manual step (plan §7). [15][16]

**Kannada UI: NOT AVAILABLE.** 38 UI languages, Kannada not among them → editors work in an English UI; Kannada content is fully supported inside fields. Member guide will use English with Kannada labels in parentheses. [14]

**Preview: ADEQUATE** on mobile (inline + full-screen, responsive). [15]

**Decision:** proceed with Sveltia CMS. Mandatory mitigations shipped: transform config (done), member guide in simple English + Kannada labels, on-Android acceptance checklist in docs.


## Sources
- [1] https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization
- [2] https://sveltiacms.app/en/docs/backends/github
- [3] https://sveltiacms.app/en/docs/workflows/editorial
- [4] https://developers.cloudflare.com/pages/platform/limits/
- [5] https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
- [6] https://developers.cloudflare.com/workers/platform/pricing/
- [7] https://sveltiacms.app/en/docs/start
- [8] https://sveltiacms.app/en/docs/media/internal
- [9] https://sveltiacms.app/en/docs/media/cloudflare-r2
- [10] https://developers.cloudflare.com/images/pricing/
- [11] https://github.com/sveltia/sveltia-cms-auth/issues/15
- [12] https://github.com/sveltia/sveltia-cms-auth (README, verified 2026-11-11 for the OAuth-App flow; re-verified 2026-11-12 — README now documents GitHub App registration as the standard setup)
- [13] https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps
- [14] https://sveltiacms.app/en/docs/ui (UI language list)
- [15] https://github.com/sveltia/sveltia-cms (source: rich-text-editor.svelte responsive rules, upload-assets-dialog.svelte native picker, default media-library transformations)
- [16] https://www.npmjs.com/package/sveltia-cms (small-screen caveat note)
