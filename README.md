# PulsePrep — cloud edition

Interview practice with six role paths, practice/full-mock modes, structured illustrative feedback, saved reports, PDF export and optional project/topic references.

Light and dark themes follow your system preference initially. Use the theme button at the top to choose a mode; the preference stays in this browser across reloads and sign-in. Printed reports remain light for readability.

**Stack:** React + Vinext on Cloudflare Workers, Convex, Better Auth. No Netlify, D1 or paid AI dependency. This is separate from the unchanged laptop demo in `../level-1`.

## Hackathon release

Frontend address: [Open PulsePrep](https://pulseprep-blackster9263.spry-haven-6235.chatgpt.site).

The production Convex backend is deployed in **Canada (Central)** as `canada-production`, with Better Auth and account-owned interview records. See [SUBMISSION.md](SUBMISSION.md) for the pitch, demonstration steps and honest feature boundaries. A registered frontend address alone does not prove publication; the submission handoff reports the verified deployment result.

## Local setup

Use Node.js 22.13+ and npm:

```sh
npm ci
npm test
npm run typecheck
```

1. Create an account at [Convex](https://dashboard.convex.dev).
2. Run `npm run convex:dev` from this folder. Sign in in your browser and create/select your own development project. The official CLI regenerates `convex/_generated/` and writes ignored local configuration. If the first push reports missing auth configuration, set the two dashboard values in step 3 and rerun the command; keep it running afterward.
3. In that deployment's Convex dashboard, set `SITE_URL` to `http://127.0.0.1:5173` and `BETTER_AUTH_SECRET` to a fresh random secret of at least 32 characters. Use a password manager/secret generator. Do not put the secret in frontend configuration, chat, source control or command-line arguments.
4. Create an ignored `.dev.vars` for the Cloudflare local runtime:

```dotenv
PULSEPREP_CONVEX_URL=<your development deployment's .convex.cloud URL>
PULSEPREP_CONVEX_SITE_URL=<that deployment's .convex.site URL>
PULSEPREP_SITE_URL=http://127.0.0.1:5173
```

Use the exact URLs from the dashboard; don't assume another deployment's names. These three URLs are public configuration, not secret keys. Do not use the angle-bracket placeholders literally.

5. Run `npm run dev -- --hostname 127.0.0.1`, then open `http://127.0.0.1:5173`. Create a new demo account with a unique password of 12–128 characters.

No Convex account yet? The original laptop demo is the runnable keyless prototype; this cloud edition deliberately requires real accounts.

## Production release

1. Use the official Convex deployment workflow to publish to your production deployment and regenerate actual deployment types. This project's backend is `https://tidy-snake-567.ca-central-1.convex.cloud` and its HTTP origin is `https://tidy-snake-567.ca-central-1.convex.site`. It is the named `canada-production` deployment, not the automatically provisioned default production deployment. A future release must use a deployment-scoped key for `canada-production`; do not run the unqualified deploy script against the unrelated default. Create/revoke keys through the official Convex CLI, keep them out of source and command-line arguments, and do not rotate the existing Better Auth secret for routine code updates.
2. Set production Convex `SITE_URL` to the exact final HTTPS frontend origin, without a trailing slash. Set a distinct, high-entropy production `BETTER_AUTH_SECRET` in Convex only.
3. Configure these Cloudflare runtime bindings using the hosting platform's environment settings:
   - `PULSEPREP_CONVEX_URL`: production `.convex.cloud` URL
   - `PULSEPREP_CONVEX_SITE_URL`: matching production `.convex.site` URL
   - `PULSEPREP_SITE_URL`: exact public HTTPS frontend origin
4. Run `npm test`, `npm run typecheck`, then build with `NEXT_PUBLIC_CONVEX_URL` set to the **same production Convex URL** as `PULSEPREP_CONVEX_URL`. The official Better Auth Next.js server adapter uses this build-time variable for authenticated function calls; leaving a development URL in the build makes interviews fail even when browser sign-in works. In PowerShell, set `$env:NEXT_PUBLIC_CONVEX_URL = 'https://tidy-snake-567.ca-central-1.convex.cloud'` immediately before `npm run build`. Set that public URL in the hosting environment too. Keep the starter's Sites/Vinext Worker build integration. This app is not a static-only Pages export; same-origin API/auth routes need a Worker.
5. Publish the verified Worker using the connected Sites workflow, retaining `.openai/hosting.json`'s registered Site ID. Set public access only for the final release. Don't publish a setup-only screen as a completed product.
6. Verify anonymous reachability, sign-up, sign-in, interview, report/PDF, refresh, sign-out, cross-user denial and history deletion on the actual HTTPS deployment.

The registered frontend origin is `https://pulseprep-blackster9263.spry-haven-6235.chatgpt.site`; registration alone does **not** mean it is live. If the hosting origin changes, update both the backend `SITE_URL` and frontend `PULSEPREP_SITE_URL` together.

To preview the built Worker locally: `npm start -- --port 8787`. This does not deploy anything. Its configured frontend origin must match the preview URL, including its port.

## Behavior and boundaries

- Better Auth uses email/password, secure HTTPS cookies, database-backed authentication rate limiting and disabled account linking. Email verification, password recovery and OAuth providers are **not configured**. Use demo-only credentials; this is not yet a production identity service for sensitive use.
- Convex functions require authenticated identity, a still-active Better Auth session and ownership for each interview/report. A signed JWT alone cannot bypass sign-out. Reports and reviewed GitHub previews are stored in Convex, not process memory. Browser drafts are account-namespaced and cleared on sign-out; captured scopes and request revisions prevent delayed account responses from changing another account's pointers. Drafts are not encrypted, so avoid shared devices for sensitive information.
- GitHub reads only public repository metadata with user review/consent. Up to three repositories are imported; templates discuss the first. Previews are usable for 30 minutes, kept until replacement/cleanup on a later import or history deletion, with at most ten per account.
- LinkedIn experience is manually supplied. LeetCode topics are manually selected. Neither service's account, solved history or private data is accessed. No code is executed and no LeetCode questions are copied.
- Scoring is a transparent **illustrative heuristic, not live AI or a hiring verdict**. No Gemini/OpenAI key is required, and no answers are sent to an AI provider.
- Demo quotas: 12 new interviews/hour, 80 answer/skip/finish writes/minute, eight GitHub imports/hour and 100 stored interviews/account. History displays the latest 20 completed interviews. Delete-history permanently deletes all interview/report records and previews in that account and invalidates already-running imports. It does not delete the auth account, rate-limit rows or deletion-generation marker.
- Storage uploads/R2, PostHog, billing, camera/microphone and live AI are not included. Add only when needed, with appropriate consent and service configuration.

## Verification

`npm test` runs the domain/storage checks and real Convex function + Better Auth HTTP handler tests in `convex-test`. They verify account boundaries and persistence in a local test harness, not a deployed Convex service. `npm run typecheck` checks the app and backend. `npm run build` produces the Cloudflare Worker artifact.

The React provider has one documented type-only compatibility bridge for the official Convex Better Auth 0.12.5 client declaration on Better Auth 1.6.33. Remove it when upstream's declaration is corrected; don't silently upgrade Better Auth to 1.7 without checking the component's peer range.

No secrets, SQLite databases, local interview history or dependency caches should be included in a source archive. Synced project files under `sources/` are read-only and are not part of this checkout.
