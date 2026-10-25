import assert from 'node:assert'
import { applyConstraints, buildExplanation, CONSTRAINTS } from '../lib/senior.js'
import handler from '../api/recommend.js'

let passed = 0
function ok(name, cond) {
  assert(cond, name)
  passed++
  console.log(`  PASS ${name}`)
}

const soupPlace = { name: 'Soup House', tags: ['soup', 'soft', 'quiet'] }
const loudPlace = { name: 'Spice Den', tags: ['spicy', 'loud'] }

// --- constraint filter ---
let r = applyConstraints([soupPlace, loudPlace], ['soft'])
ok('tag constraint keeps the matching venue', r.results.length === 1 && r.results[0].entity.name === 'Soup House')
ok('matched need recorded', r.results[0].matched['Easy to chew / soft foods'] !== undefined)

r = applyConstraints([loudPlace], ['soft'])
ok('empty filter falls back to all + note', r.results.length === 1 && r.note !== null)

r = applyConstraints([soupPlace, loudPlace], ['lowSalt'])
ok('guidance-only constraint never filters', r.results.length === 2)
ok('guidance text returned', r.guidance.length === 1 && r.guidance[0].label === 'Low salt')

r = applyConstraints([soupPlace], ['nope'])
ok('unknown constraint id ignored', r.results.length === 1)

// --- explanations ---
const ex = buildExplanation(soupPlace, ['Jazz', 'Ramen'], { 'Easy to chew / soft foods': ['soup'] })
ok('explanation names taste + need', ex.includes('Jazz') && ex.includes('Easy to chew'))
ok('explanation falls back gracefully', buildExplanation(soupPlace, [], {}).length > 0)

// --- handler end to end (mocked Qloo) ---
function mockRes() {
  const res = {}
  res.status = (code) => { res.code = code; return res }
  res.json = (body) => { res.body = body; return res }
  return res
}

process.env.QLOO_API_KEY = 'test-key'
globalThis.fetch = async (url) => {
  if (url.includes('/v2/search')) {
    return { ok: true, json: async () => ({ results: { entities: [
      { entity_id: 'e1', name: 'Jazz' }, { entity_id: 'e2', name: 'Ramen' } ] } }) }
  }
  if (url.includes('/v2/insights')) {
    return { ok: true, json: async () => ({ results: { entities: [soupPlace, loudPlace] } }) }
  }
  return { ok: false, status: 404, json: async () => ({}) }
}

let res = mockRes()
await handler({ method: 'POST', body: { likes: 'jazz, ramen', constraints: ['soft', 'lowSalt'], location: 'Nagpur' } }, res)
ok('handler 200', res.code === 200)
ok('handler filters to soft venue', res.body.results.length === 1 && res.body.results[0].name === 'Soup House')
ok('handler explains the pick', res.body.results[0].explanation.includes('Jazz'))
ok('handler returns dining-tip guidance', res.body.guidance.length === 1)
ok('handler echoes seeds', res.body.seeds.includes('Jazz'))

// Location fallback: insights rejects the location param, accepts without it.
let insightsCalls = 0
globalThis.fetch = async (url) => {
  if (url.includes('/v2/search')) {
    return { ok: true, json: async () => ({ results: { entities: [{ entity_id: 'e1', name: 'Jazz' }] } }) }
  }
  if (url.includes('/v2/insights')) {
    insightsCalls++
    if (url.includes('filter.location.query')) {
      return { ok: false, status: 400, json: async () => ({}) }
    }
    return { ok: true, json: async () => ({ results: { entities: [soupPlace] } }) }
  }
  return { ok: false, status: 404, json: async () => ({}) }
}
res = mockRes()
await handler({ method: 'POST', body: { likes: 'jazz', constraints: [], location: 'Nagpur' } }, res)
ok('location rejection retried without location', res.code === 200 && insightsCalls === 2 && res.body.results.length === 1)

// Key missing -> 503, never fake data.
delete process.env.QLOO_API_KEY
res = mockRes()
await handler({ method: 'POST', body: { likes: 'jazz' } }, res)
ok('missing key gives clear 503', res.code === 503)

// Non-POST -> 405.
process.env.QLOO_API_KEY = 'test-key'
res = mockRes()
await handler({ method: 'GET', body: {} }, res)
ok('non-POST rejected', res.code === 405)

console.log(`${passed} SeniorTable tests passed`)
