'use client'

import { DAY_COLORS } from '@/lib/constants'

interface Props {
  days: number[]
  selected: number | null  // null = "All"
  onSelect: (day: number | null) => void
}

export default function DaySelector({ days, selected, onSelect }: Props) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 overflow-x-auto shrink-0">
      <div className="flex gap-1.5 min-w-max">

        {/* All tab */}
        <button
          onClick={() => onSelect(null)}
          className={`h-8 px-3 rounded-full text-xs font-bold transition-all ${
            selected === null
              ? 'bg-gray-800 text-white shadow ring-2 ring-offset-1 ring-gray-800'
              : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
          }`}
          title="All days"
        >
          All
        </button>

        {days.map(day => {
          const color = DAY_COLORS[day] ?? '#888'
          const isSelected = day === selected
          return (
            <button
              key={day}
              onClick={() => onSelect(day)}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                isSelected
                  ? 'text-white shadow ring-2 ring-offset-1'
                  : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
              }`}
              style={isSelected ? { backgroundColor: color, ringColor: color } : {}}
              title={`Day ${day}`}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
