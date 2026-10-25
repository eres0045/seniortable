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
- ✅ 23 tests passing (`npm test`): 7 client + 16 SeniorTable (constraint
  filter, fallback, explanations, full handler flow, location retry, 503/405).
- ✅ Production build verified (`npm run build`, 30 modules).
- ✅ Key hygiene verified: zero `QLOO_API_KEY` references in the frontend
  bundle or `src/` — all Qloo calls go through `/api/recommend`.
- ⏳ Live API integration test — blocked on the API key.
- ⏳ Hosted-demo cold-visit check — blocked on GitHub push + Vercel deploy.
- ⏳ Criteria checklist with per-criterion evidence — drafted above, finalized
  at submission time after the live checks.

## Setup
- `QLOO_API_KEY` env var on the server (Vercel env). Key is issued via
  Qloo's API Access Key form; earlier Qloo hackathon rules promised a key
  within 4 hours of the form. Hackathon API base: https://hackathon.api.qloo.com
- Run locally: `npm install && npm run dev` (needs the key for live calls;
  without it the API route returns a clear 503, never fake data).
