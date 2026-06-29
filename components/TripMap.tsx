'use client'

import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Stop } from '@/lib/types'
import { DAY_COLORS } from '@/lib/constants'

function linkStyle(color: string): React.CSSProperties {
  return {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    border: `1px solid ${color}`,
    color,
    fontSize: 11,
    fontWeight: 600,
    textDecoration: 'none',
    lineHeight: '18px',
  }
}

// Smooth fly-to on day change; hard fit only on first load
function FlyToBounds({ focusStops, allStops }: { focusStops: Stop[]; allStops: Stop[] }) {
  const map = useMap()
  const isFirst = useRef(true)

  useEffect(() => {
    const target = focusStops.length > 0 ? focusStops : allStops
    if (target.length === 0) return
    const L = (window as any).L
    const bounds = L.latLngBounds(target.map((s: Stop) => [s.lat, s.lng]))
    if (isFirst.current) {
      map.fitBounds(bounds, { padding: [40, 40] })
      isFirst.current = false
    } else {
      map.flyToBounds(bounds, { padding: [40, 40], duration: 0.8, easeLinearity: 0.5 })
    }
  }, [focusStops, map, allStops])

  return null
}

function makeIcon(label: number | string, color: string, opacity: number) {
  const L = (window as any).L
  const text = String(label)
  const size = text.length > 1 ? 24 : 22
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:${size <= 22 ? 9 : 10}px;font-weight:700;color:#fff;
      opacity:${opacity};line-height:1;transition:opacity 0.3s;
    ">${text}</div>`,
  })
}

interface Props {
  allStops: Stop[]          // every stop across all days
  selectedDay: number | null  // null = "All" view
  prevStop?: Stop | null
}

const ALL_VIEW_HIDDEN = new Set(['Centelles', 'Milano'])

export default function TripMap({ allStops, selectedDay, prevStop }: Props) {
  const isAllView = selectedDay === null
  const dayColor = selectedDay !== null ? (DAY_COLORS[selectedDay] ?? '#888') : '#888'

  // In the all-days view, hide transit-only stops
  const visibleStops = isAllView ? allStops.filter(s => !ALL_VIEW_HIDDEN.has(s.nom)) : allStops

  // Stops to fly-zoom to when the day changes
  const focusStops = isAllView
    ? visibleStops
    : allStops.filter(s => s.day === selectedDay)

  // Polyline for single-day view
  const dayStops = allStops.filter(s => s.day === selectedDay)
  const polylinePositions: [number, number][] = [
    ...(prevStop ? [[prevStop.lat, prevStop.lng] as [number, number]] : []),
    ...dayStops.map(s => [s.lat, s.lng] as [number, number]),
  ]

  // Sequential index within the selected day (for popup label)
  const dayIndexMap = new Map<number, number>()
  dayStops.forEach((s, i) => dayIndexMap.set(visibleStops.indexOf(s), i + 1))

  return (
    <div className="flex-1 relative">
      <MapContainer
        center={[47.5, 18.5]}
        zoom={6}
        style={{ width: '100%', height: '100%' }}
        zoomControl
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Day route polyline — single-day only */}
        {!isAllView && polylinePositions.length > 1 && (
          <Polyline positions={polylinePositions} color={dayColor} weight={2} opacity={0.5} dashArray="6 4" />
        )}

        {/* Previous day anchor dot */}
        {!isAllView && prevStop && (() => {
          const L = (window as any).L
          const icon = L.divIcon({
            className: '',
            iconSize: [10, 10],
            iconAnchor: [5, 5],
            html: `<div style="width:10px;height:10px;border-radius:50%;background:#aaa;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
          })
          return (
            <Marker position={[prevStop.lat, prevStop.lng]} icon={icon}>
              <Popup maxWidth={200}>
                <p style={{ fontSize: 11, color: '#888', margin: 0 }}>← Day {prevStop.day} last stop</p>
                <p style={{ fontWeight: 700, fontSize: 12, margin: '2px 0 0' }}>{prevStop.nom}</p>
              </Popup>
            </Marker>
          )
        })()}

        {/* All markers — dimmed when not the selected day */}
        {visibleStops.map((stop, i) => {
          const isActive = isAllView || stop.day === selectedDay
          const markerColor = DAY_COLORS[stop.day] ?? '#888'
          const opacity = isActive ? 1 : 0.3
          const label = isAllView ? stop.day : (dayIndexMap.get(i) ?? stop.day)
          return (
            <Marker
              key={i}
              position={[stop.lat, stop.lng]}
              icon={makeIcon(label, markerColor, opacity)}
            >
              <Popup maxWidth={300}>
                <div style={{ fontSize: 13 }}>
                  <p style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>
                    Day {stop.day}
                    {stop.optional && <span style={{ color: '#f59e0b', marginLeft: 4 }}>optional</span>}
                  </p>
                  <p style={{ fontWeight: 700, marginBottom: 4, color: '#111' }}>{stop.nom}</p>
                  {stop.notes && (
                    <p style={{ fontSize: 10, color: '#888', marginBottom: 4, fontStyle: 'italic' }}>{stop.notes}</p>
                  )}
                  {stop.description && (
                    <p style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 6 }}>
                      {stop.description}
                    </p>
                  )}
                  <p style={{ fontSize: 10, color: '#aaa', marginBottom: 6 }}>
                    {stop.time_min > 0 && `⏱ ${stop.time_min} min`}
                    {stop.time_min > 0 && stop.drive_km > 0 && '  ·  '}
                    {stop.drive_km > 0 && `🚗 +${stop.drive_km} km`}
                  </p>
                  {(stop.maps || stop.google || stop.wikipedia) && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {stop.maps && (
                        <a href={stop.maps} target="_blank" rel="noopener noreferrer" style={linkStyle('#4285f4')}>
                          📍 Maps
                        </a>
                      )}
                      {stop.google && (
                        <a href={stop.google} target="_blank" rel="noopener noreferrer" style={linkStyle('#34a853')}>
                          🔍 Google
                        </a>
                      )}
                      {stop.wikipedia && (
                        <a href={stop.wikipedia} target="_blank" rel="noopener noreferrer" style={linkStyle('#888')}>
                          📖 Wikipedia
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}

        <FlyToBounds focusStops={focusStops} allStops={allStops} />
      </MapContainer>
    </div>
  )
}
