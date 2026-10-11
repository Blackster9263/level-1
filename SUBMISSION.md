# PulsePrep — hackathon submission

## One-line pitch

Practice role-specific interviews, turn your project experience into discussion prompts, and review transparent feedback with a saved progress history.

## Project links

- Frontend: https://pulseprep.spry-haven-6235.chatgpt.site
- Submission repository: https://github.com/Blackster9263/level-1
- Backend: Convex, Canada (Central), named production deployment `canada-production`.

Check the final submission handoff for live verification and repository upload status. Registration or a link in this document is not evidence that publication succeeded.

## Two-minute demonstration

1. Open the frontend and create a demo account with a unique password of at least 12 characters. Do not reuse a real password.
2. Choose a role and practice mode. Optionally add a public GitHub username, review the imported repository context, and select topic references.
3. Start an interview and answer a question with a situation, your action, and the measurable result.
4. Review practice feedback; finish the interview to see the complete report. Full-mock mode delays feedback until completion.
5. Export the report as a PDF and open saved history. Refresh to demonstrate server-backed persistence.
6. Sign out. Sign into a second demo account to demonstrate separate history.

## Implemented scope

- Six role paths; practice and full-mock modes.
- Question progression, answer drafts, skip and finish controls.
- Structured heuristic feedback, report history and PDF export.
- Better Auth email/password accounts and sessions.
- Convex persistence, active-session checks, ownership enforcement and demo rate limits.
- Public GitHub repository metadata import with review before use.
- Manual LinkedIn experience and LeetCode topic references.
- Responsive interface and a Cloudflare Worker frontend/API.
- Light/dark mode with an initial system preference and a remembered browser choice.

## Architecture

Browser → Cloudflare Worker (React/Vinext and same-origin auth/API routes) → Convex functions and database. Better Auth uses the Convex component. Personal reads and writes require a valid active session and matching record owner. Only public backend URLs reach the frontend; the authentication secret stays in Convex.

## What not to claim

This release uses an **illustrative scoring heuristic**, not a live LLM or a hiring verdict. No AI-provider key was supplied. LinkedIn and LeetCode are manual references, not connected accounts or scraped solved histories. Email verification, password recovery, social OAuth, uploads/R2, PostHog, payments and video/audio analysis are not included. Use demo-only accounts and avoid sensitive answers.

## Run from source

If GitHub contains the source ZIP, download and extract it first. Then follow README.md: Node 22.13+, `npm ci`, `npm test`, `npm run typecheck`, your own Convex development project, its backend auth settings and ignored local Cloudflare URL bindings, then `npm run dev -- --hostname 127.0.0.1`.

Do not commit `.env.local`, `.dev.vars`, API keys, dependency folders or local runtime data. Tests run locally with convex-test and do not use production credentials.
