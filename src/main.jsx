import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CONSTRAINTS } from '../lib/senior.js'

const TASTE_CHIPS = ['Jazz', 'Old Bollywood', 'Italian', 'South Indian', 'Chinese', 'Continental', 'Bhakti music', 'Ghazals']

function App() {
  const [likes, setLikes] = useState('')
  const [city, setCity] = useState('')
  const [checked, setChecked] = useState({ soft: true })
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function toggle(id) {
    setChecked((c) => ({ ...c, [id]: !c[id] }))
  }

  async function run() {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          likes,
          constraints: Object.keys(checked).filter((k) => checked[k]),
          location: city,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
      setData(body)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 760, margin: '0 auto', padding: 24, fontSize: 18, lineHeight: 1.5 }}>
      <h1 style={{ fontSize: 34 }}>SeniorTable</h1>
      <p>Meals that fit your taste <em>and</em> your needs. Tell the agent what you love, and what you need — it does the rest.</p>

      <h2>1. What do you love?</h2>
      <input
        value={likes}
        onChange={(e) => setLikes(e.target.value)}
        placeholder="e.g. jazz, South Indian food, old films"
        style={{ width: '100%', padding: 14, fontSize: 18 }}
      />
      <div style={{ marginTop: 10 }}>
        {TASTE_CHIPS.map((chip) => (
          <button key={chip} onClick={() => setLikes((l) => (l ? `${l}, ${chip}` : chip))}
            style={{ margin: 4, padding: '8px 14px', fontSize: 16 }}>
            {chip}
          </button>
        ))}
      </div>

      <h2>2. What do you need?</h2>
      {Object.entries(CONSTRAINTS).map(([id, c]) => (
        <label key={id} style={{ display: 'block', margin: '8px 0' }}>
          <input type="checkbox" checked={!!checked[id]} onChange={() => toggle(id)} style={{ transform: 'scale(1.4)', marginRight: 10 }} />
          {c.label}
          {c.kind === 'guidance' && <span style={{ color: '#555' }}> (shown as a tip, not a filter)</span>}
        </label>
      ))}

      <h2>3. Which city?</h2>
      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="e.g. Nagpur"
        style={{ width: '100%', padding: 14, fontSize: 18 }}
      />

      <button onClick={run} disabled={loading || !likes.trim()}
        style={{ marginTop: 20, padding: '14px 28px', fontSize: 19, fontWeight: 'bold' }}>
        {loading ? 'Asking the agent…' : 'Find my meals'}
      </button>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {data && (
        <section style={{ marginTop: 28 }}>
          {data.note && <p style={{ background: '#fff8e1', padding: 12 }}>{data.note}</p>}
          {data.seeds?.length > 0 && <p>Based on your taste for: {data.seeds.join(', ')}</p>}
          {data.results.length === 0 && <p>No picks yet — try different likes.</p>}
          {data.results.map((r, i) => (
            <article key={i} style={{ border: '1px solid #ccc', borderRadius: 12, padding: 16, margin: '14px 0' }}>
              <h3 style={{ margin: '0 0 6px' }}>{r.name}</h3>
              <p style={{ margin: '0 0 6px' }}>{r.explanation}</p>
              {r.matchedNeeds.length > 0 && <p style={{ margin: 0 }}>✓ Matches: {r.matchedNeeds.join(', ')}</p>}
              {r.tags?.length > 0 && <p style={{ margin: '6px 0 0', color: '#555' }}>Tags: {r.tags.slice(0, 8).join(', ')}</p>}
            </article>
          ))}
          {data.guidance?.length > 0 && (
            <div style={{ background: '#eef6ff', padding: 14, borderRadius: 12 }}>
              <strong>Dining tips for your needs:</strong>
              <ul>{data.guidance.map((g, i) => <li key={i}>{g}</li>)}</ul>
            </div>
          )}
        </section>
      )}
      <footer style={{ marginTop: 40, color: '#555', fontSize: 15 }}>
        SeniorTable matches taste and venue tags. It is not medical advice — for health
        decisions, talk to your doctor or pharmacist.
      </footer>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
