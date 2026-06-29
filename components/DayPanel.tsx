'use client'

import type { Stop } from '@/lib/types'
import { DAY_COLORS } from '@/lib/constants'

interface Props {
  stops: Stop[]
  day: number
  label: string
  open: boolean
  onToggle: () => void
}

function StopItem({ stop, index }: { stop: Stop; index: number }) {
  return (
    <li className={`px-4 py-3 flex gap-2.5 ${stop.optional ? 'opacity-50' : ''}`}>
      <span className="text-xs text-gray-300 font-mono mt-0.5 w-4 shrink-0 text-right">
        {index + 1}
      </span>
      <div className="min-w-0">
        <div className="flex items-start gap-1.5 flex-wrap">
          <p className="font-semibold text-xs text-gray-900 leading-snug">{stop.nom}</p>
          {stop.optional && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-gray-100 text-gray-400 font-medium leading-none mt-0.5">
              opt
            </span>
          )}
        </div>
        {stop.description && (
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed line-clamp-2">
            {stop.description}
          </p>
        )}
        <div className="flex gap-2 mt-1 text-[10px] text-gray-300">
          {stop.time_min > 0 && <span>{stop.time_min} min</span>}
          {stop.drive_km > 0 && <span>+{stop.drive_km} km</span>}
        </div>
      </div>
    </li>
  )
}

export default function DayPanel({ stops, day, label, open, onToggle }: Props) {
  const color = DAY_COLORS[day] ?? '#888'
  const totalVisit = stops.reduce((s, r) => s + r.time_min, 0)
  const totalKm    = stops.reduce((s, r) => s + r.drive_km, 0)
  const required   = stops.filter(s => !s.optional).length
  const optional   = stops.filter(s => s.optional).length

  const stopList = (
    <ul className="divide-y divide-gray-50 overflow-y-auto flex-1">
      {stops.map((stop, i) => <StopItem key={i} stop={stop} index={i} />)}
    </ul>
  )

  return (
    <>
      {/* ── Desktop: left sidebar ── */}
      <aside className="hidden lg:flex w-72 shrink-0 bg-white border-r border-gray-100 flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 shrink-0">
          <div
            className="inline-block text-xs font-bold px-2 py-0.5 rounded-full text-white mb-2"
            style={{ backgroundColor: color }}
          >
            Day {day}
          </div>
          <h2 className="font-bold text-gray-900 text-sm leading-snug">{label}</h2>
          <div className="flex flex-wrap gap-x-3 mt-2 text-xs text-gray-400">
            <span>⏱ {totalVisit} min</span>
            <span>🚗 ~{totalKm} km</span>
            <span>{required} stops{optional > 0 ? ` + ${optional} opt` : ''}</span>
          </div>
        </div>
        {stopList}
      </aside>

      {/* ── Mobile: bottom sheet ── */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl flex flex-col z-[1000] transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-[calc(100%-68px)]'}`}
        style={{ maxHeight: '65vh' }}
      >
        {/* Handle + summary row — tap to toggle */}
        <div className="shrink-0 cursor-pointer select-none" onClick={onToggle}>
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-8 h-1 rounded-full bg-gray-300" />
          </div>
          <div className="flex items-center gap-2 px-4 pb-3">
            <div
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0"
              style={{ backgroundColor: color }}
            >
              {day}
            </div>
            <p className="font-semibold text-sm text-gray-900 truncate flex-1">{label}</p>
            <div className="flex gap-2 text-xs text-gray-400 shrink-0">
              <span>⏱{totalVisit}m</span>
              <span>🚗{totalKm}km</span>
            </div>
            <span className="text-gray-300 text-xs ml-1">{open ? '▼' : '▲'}</span>
          </div>
        </div>

        {/* Stop list — only visible when open */}
        {stopList}
      </div>
    </>
  )
}
