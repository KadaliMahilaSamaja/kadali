# Admin guide — Kadali website

This guide is for the Kadali club administrator.
It covers the one-time setup, adding and removing members, reviewing and publishing, backups, and troubleshooting.

Member-facing instructions live in the [publishing guide](publishing-guide.md). System design and limits are in the [architecture overview](architecture.md). Research and source links are in the [validation report](validation.md).

Stack: Astro static site, Sveltia CMS v0.262.4 (loaded pinned from unpkg) at `/admin`, sveltia-cms-auth on a free Cloudflare Worker, GitHub organization repo, Cloudflare Pages.

---

## Part A — One-time setup

Do the steps in this order. Each step has the exact click-path.

### A1. Create the GitHub organization and repository

1. Sign in at github.com with the admin account.
2. Click the **+** dropdown (top right) and choose **New organization**. Pick the free plan.
3. Name it `KadaliMahilaSamaja` (or your chosen name).
4. Create the repository: **New repository** button, name `kadali`, visibility **Public**, and push the website code to it. The final name is `KadaliMahilaSamaja/kadali`.
5. Why public: branch protection with required reviews is free for public organization repositories. Draft branches are then publicly readable — never keep confidential text in drafts.

### A2. Deploy the sveltia-cms-auth Worker

This small Worker handles member sign-in. It is free (100,000 requests per day).

1. Sign in at dash.cloudflare.com.
2. Open the [sveltia-cms-auth README](https://github.com/sveltia/sveltia-cms-auth) and click the **Deploy to Cloudflare Workers** button.
3. When deployed, open the Cloudflare dashboard, select the `sveltia-cms-auth` service, and copy the Worker URL. It looks like `https://sveltia-cms-auth.YOUR-SUBDOMAIN.workers.dev`. You need it in A3, A4, and A5.

> Note (update since the validation report was written): the validation report describes registering a classic OAuth App. The sveltia-cms-auth README has since changed to a **GitHub App**, which is better for us: the app gets access only to the installed repository instead of every repo the member can access. The steps below follow the current README. The old OAuth App method still works but is no longer documented by the project.

### A3. Register the Worker as a GitHub App

1. Open the "Register new GitHub App" link from the README ([github.com/settings/apps/new](https://github.com/settings/apps/new?name=Sveltia+CMS+Auth+for+YOUR_SITE&url=https://github.com/sveltia/sveltia-cms-auth&webhook_active=false&contents=write&pull_requests=write)). To register it under the organization instead of your personal account, replace `github.com/settings/apps/new` with `github.com/organizations/YOUR_ORG/settings/apps/new`.
2. Edit two fields:
   - **GitHub App name**: replace `YOUR_SITE` with `Kadali` (must be unique on GitHub, max 34 characters).
   - **Redirect URI**: `YOUR_WORKER_URL/callback` — paste the Worker URL from A2 followed by `/callback`.
3. Check the pre-filled fields: token expiration checked (recommended); webhook inactive; **Contents: Read and write**; **Pull requests: Read and write**; "Where can this GitHub App be installed": **Only on this account** (correct when registered under the org that owns the repo).
4. Click **Create GitHub App**. Copy the **Client ID**.
5. In the app, open **Credentials** in the sidebar, click **New secret**, and copy the generated secret. Treat it like a password.
6. Install the app on the repository: sidebar **Install App**, click **Install** next to the org, choose **Only select repositories**, select `kadali`, then click **Install**.

Members only need to authorize this app once at their first sign-in; they do not install anything.

### A4. Configure the Worker

1. Cloudflare dashboard: select the `sveltia-cms-auth` service.
2. Open **Settings** > **Runtime variables and secrets**.
3. Add:
   - `GITHUB_CLIENT_ID` = Client ID from A3.
   - `GITHUB_CLIENT_SECRET` = the secret from A3. Tick **Secret** so it is hidden.
   - `ALLOWED_DOMAINS` = the site hostnames allowed to receive tokens, comma-separated. Example once the real domain is live: `kadali.org, www.kadali.org`. Use the placeholder `kadali.example.org` until then. This stops other websites from using your Worker.
4. Click **Save and deploy**.

Local development sign-in only: temporarily add `localhost, cms.netlify.com` to `ALLOWED_DOMAINS`, or set `site_domain` in the CMS config for local use. Never deploy that config to production.

### A5. Point the CMS configuration at your setup

Edit `public/admin/config.yml` in the repository and replace the three `TODO` placeholders:

1. `backend.repo` → `KadaliMahilaSamaja/kadali`.
2. `backend.base_url` → the Worker URL from A2, e.g. `https://sveltia-cms-auth.YOUR-SUBDOMAIN.workers.dev`.
3. `site_url` → the real site URL, e.g. `https://kadali.org`.

Commit. `auth_methods: [oauth]` is already set, so the personal-token sign-in option stays hidden.

### A6. Create the Cloudflare Pages project

1. Cloudflare dashboard: **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Choose **GitHub**, authorize Cloudflare, and select the `kadali` repository.
3. Set: **Production branch** = `main`; **Build command** = `npm run build`; **Build output directory** = `dist`.
4. Click **Save and Deploy**. The first build runs and the site appears at `PROJECT.pages.dev`.

### A7. Skip builds for CMS draft branches

Every saved draft creates a branch named `cms/...`. Without this step each draft would burn one of the 500 free builds per month.

1. Cloudflare dashboard: your Pages project > **Settings** > **Builds & deployments**.
2. Production: confirm **Enable automatic production branch deployments** is ticked (this is what publishes the site when something is merged).
3. Preview deployments: choose **Custom branches**, and in **Exclude Preview branches** enter `cms/*`. (Alternatively choose **None** to switch preview builds off completely.)
4. Save. Result: only merges to `main` trigger builds; all `cms/...` draft branches are skipped.

### A8. Protect the main branch

1. On GitHub, open `KadaliMahilaSamaja/kadali` > **Settings**.
2. In the sidebar, under "Code, planning, and automation", click **Branches**.
3. Under "Branch protection rules", click **Add classic branch protection rule**.
4. **Branch name pattern**: `main`.
5. Tick **Require a pull request before merging**, and tick **Require approvals** with **Required number of approvals before merging** = 1.
6. Tick **Allow specified actors to bypass required pull requests** and add your own admin account. Reason: the **Homepage** settings collection saves straight to `main` (no review workflow); without the bypass those saves would be refused. Members are not on this list, so everything they do still requires a review.
7. Click **Create**.

### A9. Connect the domain

Apex domain (`kadali.org`):

1. Add the domain as a zone in Cloudflare and point the nameservers of your registrar to Cloudflare.
2. Cloudflare dashboard: your Pages project > **Custom domains** > **Set up a domain**, enter `kadali.org`, **Continue**. Cloudflare creates the DNS record.

Admin subdomain (`admin.kadali.org` redirects to the editor):

1. Add a DNS record for `admin` (CNAME to `PROJECT.pages.dev`), proxied by Cloudflare.
2. Cloudflare dashboard: your zone > **Rules** **Overview** > **Create rule** > **Redirect Rule**.
3. **Rule name**: `admin to /admin`.
4. **When incoming requests match**: **Wildcard pattern**, **Request URL**: `https://admin.kadali.org/*`.
5. **Then**: **Target URL** `https://kadali.org/admin/${1}`, **Status code** `301`, **Preserve query string** on.
6. Click **Deploy**.

After the domain is live, make sure `site_url` in `config.yml` (A5) uses it.

### A10. First end-to-end test

1. Invite yourself as a member (Part B), then run the member checklist in the [publishing guide](publishing-guide.md#8-acceptance-checklist--first-test-on-a-real-android-phone) on a real Android phone.
2. Publish a test article yourself and confirm it appears on the site.

---

## Part B — Adding and removing members

Members sign in with their own GitHub account. Membership = collaborator access with the **Write** role on the repository.

### Invite a member

1. She creates a free GitHub account (github.com > **Sign up**) and tells you her account name.
2. On GitHub, open `KadaliMahilaSamaja/kadali` > **Settings** > sidebar "Access" section > **Collaborators & teams**.
3. Next to "Manage access", click **Add people**.
4. Type her account name and click the matching name.
5. Under "Choose a role", select **Write**, then click **Add NAME to REPOSITORY**.
6. GitHub emails her an invitation; she must accept it. After that she can sign in at `kadali.example.org/admin`.

### Remove a member

1. Same page: **Settings** > **Collaborators & teams**.
2. Next to her name, click **Remove**.
3. Effect: she can no longer sign in to the CMS or change anything in the repository. The club's GitHub App authorization on her account remains until she revokes it, but without repository access it is useless. You can see all outside collaborators under the organization's **People** tab.

### Change a role

Same page: **Role** dropdown next to the person's name. Keep **Write** for members. Never grant **Admin** to members.

---

## Part C — Reviewing and publishing

Members save drafts and mark them Ready (details in the [publishing guide](publishing-guide.md)). Every piece of content becomes a pull request in the repository. Publishing = merging that pull request. Only merges to `main` trigger a website build (A7).

### Publish from the CMS (normal path)

1. Sign in at `/admin` and open the Editorial Workflow page (board) from the top navigation. Columns: **Draft** and **Ready**.
2. Open the entry and read it. Check: title, description, category, date, photo, Kannada text.
3. If the card is in **Draft**: move it to **Ready** (drag, or the status button in the entry editor). Moving it to Ready records your approval automatically.
4. Click the **Publish** button on the card or in the editor. Sveltia merges the pull request and deletes its branch.
5. Cloudflare Pages rebuilds automatically. The change is live in one or two minutes.

If the member already moved the entry to **Ready** herself: her own marking does not count as a review on GitHub (a person cannot approve their own work). Approve the pull request on GitHub first: repository > **Pull requests** > open the entry's pull request > **Files changed** > **Review changes** > **Approve** > **Submit review**. Then click **Publish** in the CMS.

### Alternative: review and merge on GitHub

Open the pull request, review the diff, click **Approve**, then **Merge pull request**. Use this path when a publish is refused, for example because the pull request contains files the CMS cannot show (Sveltia refuses those; review and merge them on GitHub).

### Refusals you may see

- "Entry still has required fields empty": the author must fill **Title**, **Description**, **Cover image**, **Author**, **Category**, **Publish date**, **Body** before it can be published.
- Merge refused for missing review: approve as above.
- A member publishing her own entry fails by design — the branch protection requires one approval from another person.

### Homepage settings (no review)

The **Homepage** collection (heading, description, featured article/event/gallery, banner) saves directly to the website without review. This works because your admin account is on the bypass list (A8). If a save is ever refused, edit `src/content/settings/site.json` on github.com through a normal pull request instead.

### If a member edits files directly on GitHub

Members have Write access, so they can technically bypass the CMS and edit any file on github.com. This is a documented limitation. Protection: `main` requires a review, so such edits arrive as pull requests — review them like any other change. Keep the repository free of secrets so a bypass cannot leak anything.

---

## Part D — Backups and restore

**Backup: nothing to do.** Everything — text, settings, and all uploaded photos — lives in the GitHub repository, and every save or publish is a commit. The git history is the backup.

**Restore the whole site** (deleted Pages project, lost Cloudflare account):

1. The repository still has everything. Recreate the Pages project: **Workers & Pages** > **Create application** > **Pages** > **Connect to Git** > select `KadaliMahilaSamaja/kadali`, with the same settings as A6 (production branch `main`, `npm run build`, `dist`).
2. Redo the two Cloudflare settings that do not survive: branch build skip (A7) and custom domain (A9).
3. If the Worker was deleted, redeploy it from the sveltia-cms-auth README button and redo A3/A4 (the GitHub App registration survives on GitHub; only re-enter the Worker variables).

**Undo one change:** on GitHub, open the merged pull request and click **Revert**, or open the file > **History**, pick the previous version, and restore it through a pull request. Publish the revert from the CMS or merge it on GitHub; the site rebuilds.

**Recovery check:** once a quarter, confirm you can still sign in to GitHub, Cloudflare, and the CMS, and that the latest commits contain recent photos.

---

## Part E — Costs, quotas, and the R2 upgrade path

| Service | Free quota | Club usage |
| --- | --- | --- |
| Cloudflare Pages | 500 builds/month, 20,000 files, 25 MB per file, unlimited bandwidth | A few builds per week; safe with A7 in place |
| Cloudflare Workers (auth) | 100,000 requests/day | Negligible |
| GitHub Free | Public repo, unlimited collaborators; keep repo under ~1 GB | Photos are auto-shrunk to roughly 200–400 KB each |
| Custom domains on Pages | 100 | 2 used (apex + admin redirect) |

**If the photo library ever grows too big** (years from now): Sveltia CMS has a native Cloudflare R2 integration (10 GB free, no egress fees). Trade-off: each member must enter the R2 secret key in her own browser on first use. Do this only if the repository approaches the ~1 GB guidance. Details: [validation report, section 3](validation.md#3-image-storage) and the [Sveltia R2 docs](https://sveltiacms.app/en/docs/media/cloudflare-r2).

---

## Part F — Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Sign-in fails for everyone | `base_url` in `config.yml` does not match the Worker URL | Redo A5 |
| Sign-in fails with a domain error | `ALLOWED_DOMAINS` on the Worker is missing the site hostname | Add it, **Save and deploy** (A4) |
| Sign-in fails for one member only | She was not invited, has Read-only access, or has not accepted the invitation | Redo Part B; Write role required |
| GitHub asks to "Authorize" again | New GitHub App or long absence (refresh token expires after 6 months of no use) | Normal. Authorize again |
| "Update your browser" instead of the login screen | Chrome older than version 140 | Update Chrome |
| Member cannot publish her own piece | Required review from a second person | Expected behavior. The admin publishes |
| Publish refused: pull request holds changes the CMS cannot show | Non-content files ended up in the pull request | Review and merge on GitHub (Part C) |
| Build fails on a `cms/...` branch | Draft with empty required fields breaks the Astro content schema on that branch | Harmless: those branches are skipped from builds (A7). Production is unaffected. Fill the fields before publishing |
| Build fails on `main` | Broken content or code reached `main` | Check the build log in the Pages dashboard; fix through a pull request and republish |
| Site not updating after a publish | No new build, or the merge went to the wrong branch | Pages dashboard > deployments: check the latest build for `main` |
| Build quota exhausted | Extra branches triggering preview builds | Confirm the Exclude rule `cms/*` (A7); check which branches built this month |
| Photo rejected on upload | Larger than 15 MB | Member shrinks the photo or re-shoots |
| Kannada text broken on the site | Font files missing from the build | The repo ships Noto Sans/Serif Kannada fonts; check the build did not change `src/styles` or fonts |
| Homepage save refused | Bypass list lost (A8 step 6) | Re-add the admin account to "Allow specified actors to bypass required pull requests" |
| Drafts visible to strangers | They are: the repo is public, so draft branches are readable | By design. Never draft confidential content |

---

## Security checklist

- GitHub App secret lives only in the Worker environment (stored encrypted, ticked as **Secret**). Never put it in the repository or a chat message.
- `ALLOWED_DOMAINS` is set so tokens are released only to the club's own website.
- Member tokens live only in each member's own browser; the Worker never stores them.
- The repository contains only website, content, and photos — no passwords, no member records.
- `main` is protected; one review is required; only the admin can bypass.
- A member who leaves is removed as collaborator (Part B).

*Sources and verification: [validation report](validation.md). Setup steps follow the [sveltia-cms-auth README](https://github.com/sveltia/sveltia-cms-auth) and official GitHub and Cloudflare documentation.*
