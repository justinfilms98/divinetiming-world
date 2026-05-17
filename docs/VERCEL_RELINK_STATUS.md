# Vercel relink status

## 1. Diagnosis — previously linked (wrong)

- **Org/team ID:** `team_OkMGraYAfmhboiNVDc6TkAqo`
- **Scope name:** `justinfilms98s-projects` (CLI: "justinfilms98's projects")
- **Project ID:** `prj_tjJXXEnwEzWIA4PWqHr4P9P3lnP8`
- **Project name:** `divine-timing-world`
- **Account:** Logged in as `justinfilms98` (personal account)

So the repo was linked to the **personal** Vercel scope **justinfilms98s-projects**, project **divine-timing-world**. If the intended home for Divine Timing World is a different **team** or **account**, that was the wrong link.

## 2. Unlink completed

- `.vercel/project.json` and `.vercel/README.txt` were removed.
- The `.vercel` directory was removed.
- The repo is **no longer linked** to any Vercel project.

## 3. Relink to correct project — blocker

- `vercel teams list` and `vercel switch` show **only one** scope: **justinfilms98s-projects**.
- There is **no other team or account** visible to the CLI with the current login.
- So from this environment we **cannot** relink to a different account/team because:
  - The correct scope (team slug or account) is not known to the CLI, or
  - The correct account is a different Vercel login (e.g. a team account).

**What you need to do to relink:**

**Option A — Correct project is another team under the same account**  
If the correct project is under a team that should appear in the CLI:
1. In the Vercel dashboard, confirm you’re in the right team and that the Divine Timing World project exists there.
2. If the team doesn’t show in `vercel switch`, accept any pending team invite or add this account to that team.
3. From the repo root run:  
   `vercel link --scope <correct-team-slug> --project <project-name>`  
   Use the **team slug** from the Vercel URL (e.g. `vercel.com/<team-slug>/divine-timing-world`).

**Option B — Correct project is under a different Vercel account**  
1. Log in with that account: `vercel login` (and use the correct email).
2. From the repo root run: `vercel link` and choose the correct scope and project when prompted.
3. Or run: `vercel link --scope <that-account-or-team-slug> --project <project-name>`.

After relink, run a preview deploy from branch `preview/divine-timing-audit-1` and use that deployment’s URL as the correct preview URL.

## 4. Env vars (for when you deploy on the correct project)

On the **correct** Vercel project, ensure these are set (see `docs/DEPLOYMENT_NOTES.md`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- (Optional) `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAILS`

## 5. Redeploy

- **Not done** from this environment so we don’t deploy again to the wrong project.
- After you relink locally (Option A or B), run from the repo:  
  `git checkout preview/divine-timing-audit-1`  
  then  
  `vercel --prebuilt` or `vercel`  
  and use the deployment URL as the **correct preview URL**.

---

*Last updated after unlinking and diagnosing Vercel scope.*
