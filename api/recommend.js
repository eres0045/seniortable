/**
 * SeniorTable agent endpoint (Vercel serverless).
 * POST /api/recommend { likes, constraints, location }
 *   1. Qloo search: taste words -> seed entities.
 *   2. Qloo insights: seeded restaurant recommendations (with a location
 *      attempt; retries without location if the API rejects the param).
 *   3. Constraint filter + explanations (see lib/senior.js).
 * The browser never sees QLOO_API_KEY. Without a key: clear 503, no fake data.
 */
import { createQlooClient } from '../lib/qloo.js'
import { applyConstraints, buildExplanation, CONSTRAINTS } from '../lib/senior.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' })
  }
  const apiKey = process.env.QLOO_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'Qloo API key not configured on the server' })
  }
  try {
    const qloo = createQlooClient({ apiKey })
    const { likes = '', constraints = [], location = '' } = req.body || {}
    const search = await qloo.searchEntities(likes)
    // /search returns a flat results array; accept the older
    // results.entities shape too, so a shape change never blanks the page.
    const searchList = Array.isArray(search.results)
      ? search.results
      : (search.results?.entities || [])
    const seedEntities = searchList.slice(0, 5)
    const seeds = seedEntities.map((e) => e.entity_id || e.id).filter(Boolean)
    const seedNames = seedEntities.map((e) => e.name).filter(Boolean)
    if (!seeds.length) {
      return res.status(200).json({ results: [], seeds: [], note: 'No taste matches found — try different likes.' })
    }
    let recs
    try {
      recs = await qloo.getRecommendations(seeds, 'urn:entity:place',
        location ? { 'filter.location.query': location } : {})
    } catch (e) {
      // Location param not accepted: fall back to pure taste ranking.
      recs = await qloo.getRecommendations(seeds, 'urn:entity:place')
    }
    const entities = recs.results?.entities
      || (Array.isArray(recs.results) ? recs.results : [])
    const { results, guidance, note } = applyConstraints(entities, constraints)
    const out = results.map(({ entity, matched }) => ({
      name: entity.name,
      tags: (entity.tags || []).map((t) => (typeof t === 'string' ? t : t.name)),
      explanation: buildExplanation(entity, seedNames, matched),
      matchedNeeds: Object.keys(matched),
    }))
    return res.status(200).json({
      results: out,
      seeds: seedNames,
      guidance: guidance.map((g) => g.guidance),
      note,
      constraintLabels: constraints.map((id) => CONSTRAINTS[id]?.label).filter(Boolean),
    })
  } catch (e) {
    return res.status(502).json({ error: String(e.message || e) })
  }
}
