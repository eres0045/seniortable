/**
 * Qloo Taste AI client — server-side only (the API key must never reach
 * the browser). All functions take an injectable `fetchFn` so tests can run
 * against mocked HTTP without a key or network.
 *
 * Verified: hackathon API base https://hackathon.api.qloo.com, key passed
 * via the QLOO_API_KEY env var (see a prior Qloo project's documented env
 * config). Endpoint paths are confirmed on the first live call.
 */

export function createQlooClient({ apiKey, baseUrl, fetchFn = fetch }) {
  if (!apiKey) throw new Error('QLOO_API_KEY is required')
  const base = (baseUrl || 'https://hackathon.api.qloo.com').replace(/\/$/, '')

  async function call(path, params = {}) {
    const url = new URL(base + path)
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
    }
    const res = await fetchFn(url.toString(), {
      headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
    })
    if (!res.ok) {
      throw new Error(`Qloo ${path} failed: HTTP ${res.status}`)
    }
    return res.json()
  }

  return {
    /** Search the taste graph: "ramen" -> entity IDs (people, places, things). */
    searchEntities: (query) => call('/v2/search', { query }),
    /** Recommendations seeded by entity IDs, e.g. urn:entity:restaurant. */
    getRecommendations: (seedIds, entityType, extra = {}) =>
      call('/v2/insights', {
        'filter.type': entityType,
        'signal.interests.entities': seedIds.join(','),
        ...extra,
      }),
    /** Tag taxonomy: genres, cuisines, travel themes. */
    searchTags: (query) => call('/v2/tags', { query }),
  }
}
