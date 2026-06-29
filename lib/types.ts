export interface Stop {
  day: number
  nom: string
  time_min: number
  optional: boolean
  notes: string
  description: string
  drive_km: number
  drive_min: number
  lat: number
  lng: number
  // enriched from data tab
  maps?: string
  google?: string
  wikipedia?: string
  address?: string
  info?: string
}
