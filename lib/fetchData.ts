import Papa from 'papaparse'
import type { Stop } from './types'

const SHEET_GID = process.env.NEXT_PUBLIC_SHEET_GID  // gid of itinerary tab
const DATA_GID  = process.env.NEXT_PUBLIC_DATA_GID   // gid of data tab

function sheetUrl(gid: string) {
  return `/api/sheets?gid=${gid}`
}

// Parse itinerary rows — lat/lng optional here, filled in later from data tab
function parseRows(text: string): Omit<Stop, 'lat' | 'lng'>[] {
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })
  return data
    .map(row => ({
      day:       parseInt(row.day),
      nom:       row.nom ?? '',
      time_min:  parseInt(row.time_min) || 0,
      optional:  row.optional === '1',
      notes:     row.notes ?? '',
      description: row.description ?? '',
      drive_km:  parseFloat(row.drive_km) || 0,
      drive_min: parseFloat(row.drive_min) || 0,
    }))
    .filter(s => !isNaN(s.day) && s.nom.trim() !== '')
}

// Aliases: itinerary name → data tab name (for cases where they differ)
const ALIASES: Record<string, string> = {
  'Ochtinská aragonite cave (UNESCO)': 'Cova d\'aragonita d\'Ochtinská',
}

// Returns a lookup that tries exact match first, then case-insensitive, then alias
function makeLookup(rows: Record<string, string>[]) {
  const exact = new Map<string, Record<string, string>>()
  const lower = new Map<string, Record<string, string>>()
  for (const row of rows) {
    if (!row.nom) continue
    exact.set(row.nom.trim(), row)
    lower.set(row.nom.trim().toLowerCase(), row)
  }
  return {
    get: (key: string) => {
      const k = key.trim()
      return exact.get(k)
        ?? lower.get(k.toLowerCase())
        ?? exact.get(ALIASES[k] ?? '')
    },
    size: exact.size,
  }
}

async function fetchDataTab() {
  const empty = { get: (_: string) => undefined, size: 0 }
  if (!DATA_GID) return empty
  try {
    const res = await fetch(sheetUrl(DATA_GID), { cache: 'no-store' })
    if (!res.ok) { console.warn('[fetchData] data tab fetch failed:', res.status); return empty }
    const text = await res.text()
    const { data } = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })
    const lookup = makeLookup(data)
    console.log(`[fetchData] data tab: ${lookup.size} entries`)
    return lookup
  } catch (e) {
    console.warn('[fetchData] data tab error:', e)
    return empty
  }
}

export async function fetchItinerary(): Promise<Stop[]> {
  if (!SHEET_GID) throw new Error('NEXT_PUBLIC_SHEET_GID is not set')

  const res = await fetch(sheetUrl(SHEET_GID), { cache: 'no-store' })
  if (!res.ok) throw new Error(`Sheets proxy returned ${res.status}`)

  const text = await res.text()
  const rows = parseRows(text)
  if (rows.length === 0) throw new Error('Itinerary loaded but 0 rows parsed — check column headers')

  console.log(`[fetchData] itinerary: ${rows.length} rows from Sheets`)

  // Enrich from data tab: coordinates + links
  const dataLookup = await fetchDataTab()

  const stops: Stop[] = rows
    .map(row => {
      const d = dataLookup.get(row.nom)
      const parseCoord = (v?: string) => parseFloat((v ?? '').replace(',', '.'))
      const lat = parseCoord(d?.lat)
      const lng = parseCoord(d?.lng)
      // maps and google are always derived from the stop name (Sheets exports
      // HYPERLINK formulas as display text "Obrir", not the actual URL)
      const maps   = `https://www.google.com/maps/search/${encodeURIComponent(row.nom)}`
      const google = `https://www.google.com/search?q=${encodeURIComponent(row.nom)}`
      return {
        ...row,
        lat,
        lng,
        maps,
        google,
        wikipedia: d?.wikipedia || undefined,
        address:   d?.address   || undefined,
        info:      d?.info      || undefined,
      }
    })
    .filter(s => !isNaN(s.lat) && !isNaN(s.lng))  // only keep stops we can place on the map

  const unmatched = rows.filter(r => !dataLookup.get(r.nom))
  if (unmatched.length) console.warn('[fetchData] no data tab match:', unmatched.map(r => `"${r.nom}"`).join(', '))
  console.log(`[fetchData] ${stops.length}/${rows.length} stops have coordinates`)
  return stops
}
