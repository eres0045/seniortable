import { createQlooClient } from '../lib/qloo.js'
import assert from 'node:assert'

let passed = 0
function ok(name, cond) {
  assert(cond, name)
  passed++
  console.log(`  PASS ${name}`)
}

// Mocked fetch: records requests, returns canned Qloo-shaped payloads.
const seen = []
async function mockFetch(url, opts) {
  seen.push({ url, key: opts.headers['X-Api-Key'] })
  if (url.includes('/search')) {
    return { ok: true, json: async () => ({ results: [{ id: 'e1', name: 'Ramen' }] }) }
  }
  if (url.includes('/v2/insights')) {
    return { ok: true, json: async () => ({ results: { entities: [{ id: 'r1', name: 'Noodle House' }] } }) }
  }
  if (url.includes('/v2/tags')) {
    return { ok: true, json: async () => ({ results: { tags: [{ id: 't1', name: 'Japanese' }] } }) }
  }
  return { ok: false, status: 404, json: async () => ({}) }
}

const qloo = createQlooClient({ apiKey: 'test-key', fetchFn: mockFetch })

const s = await qloo.searchEntities('ramen')
ok('search uses /search and returns a flat results array', Array.isArray(s.results) && s.results[0].name === 'Ramen')
ok('search sends take', seen[0].url.includes('take=10'))

const r = await qloo.getRecommendations(['urn:entity:artist:1'], 'urn:entity:place')
ok('recommend seeds travel in query', seen[1].url.includes('signal.interests.entities'))
ok('recommend targets place type for restaurants', seen[1].url.includes('urn%3Aentity%3Aplace'))
ok('key sent as header, not in URL', !seen[1].url.includes('test-key') && seen[1].key === 'test-key')

const t = await qloo.searchTags('Japanese')
ok('tags resolve', t.results.tags[0].name === 'Japanese')

assert.throws(() => createQlooClient({}), /QLOO_API_KEY/)
ok('missing key throws before any request', true)

const errClient = createQlooClient({
  apiKey: 'k',
  fetchFn: async () => ({ ok: false, status: 401, json: async () => ({}) }),
})
await assert.rejects(() => errClient.searchEntities('x'), /HTTP 401/)
ok('API error surfaces as thrown error', true)

console.log(`${passed} client tests passed`)
