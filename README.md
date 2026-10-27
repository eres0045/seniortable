# SeniorTable — Qloo Agentic Hackathon

SeniorTable is a dining agent for seniors: enter taste likes plus needs
(easy-to-chew, vegetarian, mild spice, quiet place, delivery-friendly, low
salt, medication-aware) and a city, and the agent returns restaurants ranked
by Qloo taste affinity and filtered by verifiable venue tags, each with a
plain-language "why this fits you" explanation. Health-adjacent needs are
never claimed as data-verified: they appear as dining tips, and the app
states it is not medical advice.

# Qloo app — Agentic Hackathon

Deadline: **Sat Oct 31, 2026, 9:15 AM IST** (Oct 30, 23:45 EDT).
Prizes: $25,000 (1st $15,000 / 2nd $6,000 / 3rd $4,000) + Jason Calacanis
investing $25,000 in his favourite entry; top 3 finalists present live Nov 5.

## Submission requirements (from the official page)
- Live, externally hosted demo app (local-only disqualifies)
- Public repo with all source + run instructions
- Text description of what it does and what makes it "Qloo-powered"
- Open-source license visible in the repo (MIT included)
- Demo video NOT required

## Judging criteria (official)
1. **Technological Implementation** — how thoroughly and skillfully the
   project uses Qloo; genuine, non-trivial implementation.
2. **Design** — a complete, coherent product experience, not a proof of concept.
3. **Potential Impact** — a credible, specific case for a real problem for a
   real audience, actually addressed by what's demonstrated.
4. **Quality of the Idea** — creative, non-obvious use of Qloo; genuine
   understanding of the problem space.

## Verification status
- ✅ 24 tests passing (`npm test`): 8 client + 16 SeniorTable (constraint
  filter, fallback, explanations, full handler flow, location retry, 503/405).
- ✅ Production build verified (`npm run build`, 30 modules).
- ✅ Key hygiene verified: zero `QLOO_API_KEY` references in the frontend
  bundle or `src/` — all Qloo calls go through `/api/recommend`.
- ✅ Live API integration test — PASSED 2026-10-27 (Vercel Production,
  commit 9f55598, Ready 08:17 IST): "Jazz" + Nagpur → 2 restaurants;
  "Italian" + Nagpur → 7 restaurants; each with a "Based on your taste for:"
  seed line, a plain-language explanation, matched needs, and venue tags.
  Earlier zero-result failures were traced to a wrong search endpoint
  (`/v2/search`); the fix uses the official GET `/search` and insights
  filter type `urn:entity:place` (see `lib/qloo.js`).
- ✅ Hosted-demo cold-visit check — https://seniortable.vercel.app live on
  Vercel Production (commit 9f55598, Ready 2026-10-27 08:17 IST).
- ✅ Criteria checklist with per-criterion evidence (finalized 2026-10-27):
  1. Technological Implementation — server-side Qloo search (`/search`)
     seeds taste entities, `/v2/insights` returns place recommendations
     ranked by taste affinity, and results are filtered by verifiable
     venue tags with explanations; no fake data, clear 503 without a key.
  2. Design — complete flow: likes + needs + city → ranked restaurants
     with explanations, matched-needs badges, tags, dining tips, and a
     not-medical-advice disclaimer; not a bare API demo.
  3. Potential Impact — seniors choosing a restaurant face real friction
     (chewing, spice, quiet, delivery, salt, medication); the demo
     addresses exactly those needs with tag-backed filters and honest
     guidance-only tips where data cannot verify a need.
  4. Quality of the Idea — taste is used cross-domain (a music/food taste
     seeds restaurant picks) rather than as a cuisine keyword search,
     and health-adjacent needs are deliberately never faked from taste data.

## Setup
- `QLOO_API_KEY` env var on the server (Vercel env, Production + Preview).
  Key issued via the Qloo Agent Hackathon API Key Request Form.
  Hackathon API base: https://hackathon.api.qloo.com
- Run locally: `npm install && npm run dev` (needs the key for live calls;
  without it the API route returns a clear 503, never fake data).
