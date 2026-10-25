/**
 * SeniorTable constraint logic — pure functions, fully unit-tested.
 *
 * Honesty rule: only tag-backed constraints filter results. Health-adjacent
 * needs (low salt, medication awareness) can NOT be verified from taste
 * data, so they never filter — they produce a "dining tip" shown next to
 * results, and the UI carries a not-medical-advice disclaimer.
 */

export const CONSTRAINTS = {
  soft: {
    label: 'Easy to chew / soft foods',
    kind: 'tag',
    tags: ['soft', 'soup', 'porridge', 'steamed', 'mashed', 'pudding',
      'yogurt', 'oatmeal', 'khichdi', 'dal', 'curd', 'custard'],
  },
  vegetarian: {
    label: 'Vegetarian',
    kind: 'tag',
    tags: ['vegetarian', 'veg', 'vegan'],
  },
  mild: {
    label: 'Mild / low spice',
    kind: 'tag',
    tags: ['mild'],
  },
  quiet: {
    label: 'Quiet place',
    kind: 'tag',
    tags: ['quiet', 'calm'],
  },
  delivery: {
    label: 'Good for delivery',
    kind: 'tag',
    tags: ['delivery', 'takeaway'],
  },
  lowSalt: {
    label: 'Low salt',
    kind: 'guidance',
    guidance: 'Salt levels are not in the taste data — ask the restaurant for low-salt preparation.',
  },
  medAware: {
    label: 'Medication-aware',
    kind: 'guidance',
    guidance: 'This app is not medical advice — share your medication list with the restaurant or pharmacist.',
  },
}

function entityTags(entity) {
  const raw = entity.tags || entity.properties?.tags || []
  return raw.map((t) => String(typeof t === 'string' ? t : t.name || '').toLowerCase())
}

function matchTags(entity, wanted) {
  const have = entityTags(entity)
  return wanted.filter((w) => have.some((h) => h.includes(w)))
}

/**
 * Filter taste-ranked entities by selected tag constraints.
 * If filtering would empty the list, return everything with a note —
 * a senior should never see a blank page because of a tag gap.
 */
export function applyConstraints(entities, selectedIds) {
  const selected = selectedIds.map((id) => CONSTRAINTS[id]).filter(Boolean)
  const tagConstraints = selected.filter((c) => c.kind === 'tag')
  const guidance = selected.filter((c) => c.kind === 'guidance')

  const scored = entities.map((entity) => {
    const matched = {}
    for (const c of tagConstraints) {
      const hits = matchTags(entity, c.tags)
      if (hits.length) matched[c.label] = hits
    }
    return { entity, matched }
  })

  let kept = tagConstraints.length
    ? scored.filter((s) => Object.keys(s.matched).length > 0)
    : scored
  let note = null
  if (kept.length === 0 && scored.length > 0) {
    kept = scored
    note = 'No venues matched all your filters, so here are the closest taste matches instead.'
  }
  return { results: kept, guidance, note }
}

/** Plain-language reason a pick fits this user. */
export function buildExplanation(entity, seedNames, matched) {
  const parts = []
  if (seedNames.length) {
    parts.push(`Matches your taste for ${seedNames.slice(0, 3).join(', ')}.`)
  }
  const labels = Object.keys(matched)
  if (labels.length) {
    parts.push(`Fits your needs: ${labels.join(', ')}.`)
  }
  if (!parts.length) {
    parts.push('Picked from your taste profile.')
  }
  return parts.join(' ')
}
