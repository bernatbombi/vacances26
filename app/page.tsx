'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { fetchItinerary } from '@/lib/fetchData'
import type { Stop } from '@/lib/types'
import { DAY_LABELS } from '@/lib/constants'
import DaySelector from '@/components/DaySelector'
import DayPanel from '@/components/DayPanel'

const TripMap = dynamic(() => import('@/components/TripMap'), { ssr: false })

export default function Page() {
  const [stops, setStops] = useState<Stop[]>([])
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    fetchItinerary()
      .then(data => {
        setStops(data)
        const first = Math.min(...[...new Set(data.map(s => s.day))].filter(d => !isNaN(d)))
        if (isFinite(first)) setSelectedDay(first)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // Collapse panel when day changes
  useEffect(() => { setPanelOpen(false) }, [selectedDay])

  const days = [...new Set(stops.map(s => s.day))].sort((a, b) => a - b)
  const isAllDays = selectedDay === null
  const dayStops = isAllDays ? stops : stops.filter(s => s.day === selectedDay)
  const prevDayStops = !isAllDays && selectedDay !== null ? stops.filter(s => s.day === selectedDay - 1) : []
  const prevStop = prevDayStops.length > 0 ? prevDayStops[prevDayStops.length - 1] : null

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 shrink-0">
        <span className="text-xl leading-none">🚐</span>
        <div>
          <h1 className="font-bold text-gray-900 text-sm leading-tight">Vacances 2026</h1>
          <p className="text-xs text-gray-400">Hungary · Slovakia · Milan · Jul 1–19</p>
        </div>
        {!loading && selectedDay && (
          <div className="ml-auto text-right">
            <p className="text-xs font-semibold text-gray-800">Day {selectedDay}</p>
            <p className="text-xs text-gray-400 hidden sm:block">{DAY_LABELS[selectedDay]}</p>
          </div>
        )}
      </header>

      {/* Day selector */}
      {!loading && !error && (
        <DaySelector days={days} selected={selectedDay} onSelect={(d) => setSelectedDay(d)} />
      )}

      {/* Body */}
      <main className="flex flex-1 overflow-hidden">
        {loading && (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Loading…
          </div>
        )}
        {error && (
          <div className="flex-1 flex items-center justify-center text-red-500 text-sm px-4 text-center">
            {error}
          </div>
        )}
        {!loading && !error && (
          <>
            {!isAllDays && selectedDay !== null && (
              <DayPanel
                stops={dayStops}
                day={selectedDay}
                label={DAY_LABELS[selectedDay] ?? ''}
                open={panelOpen}
                onToggle={() => setPanelOpen(v => !v)}
              />
            )}
            <TripMap allStops={stops} selectedDay={selectedDay} prevStop={isAllDays ? null : prevStop} />
          </>
        )}
      </main>
    </div>
  )
}
