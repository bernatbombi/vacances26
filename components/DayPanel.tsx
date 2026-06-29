import type { Stop } from '@/lib/types'
import { DAY_COLORS } from '@/lib/constants'

interface Props {
  stops: Stop[]
  day: number
  label: string
}

export default function DayPanel({ stops, day, label }: Props) {
  const color = DAY_COLORS[day] ?? '#888'
  const totalVisit = stops.reduce((s, r) => s + r.time_min, 0)
  const totalKm = stops.reduce((s, r) => s + r.drive_km, 0)
  const required = stops.filter(s => !s.optional).length
  const optional = stops.filter(s => s.optional).length

  return (
    <aside className="w-72 shrink-0 overflow-y-auto bg-white border-r border-gray-100 flex flex-col">

      {/* Day header */}
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

      {/* Stop list */}
      <ul className="divide-y divide-gray-50 overflow-y-auto flex-1">
        {stops.map((stop, i) => (
          <li
            key={i}
            className={`px-4 py-3 flex gap-2.5 ${stop.optional ? 'opacity-50' : ''}`}
          >
            <span className="text-xs text-gray-300 font-mono mt-0.5 w-4 shrink-0 text-right">
              {i + 1}
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
        ))}
      </ul>
    </aside>
  )
}
