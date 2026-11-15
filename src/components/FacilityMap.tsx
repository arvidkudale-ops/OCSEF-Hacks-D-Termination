import { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Facility } from '../data/facilities'
import { facilityTypeLabel } from '../data/facilities'
import type { RealSite } from '../lib/overpass'

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return map[character] ?? character
  })
}

export function FacilityMap({
  facilities,
  selectedId,
  user,
  center,
  realSites = [],
}: {
  realSites?: RealSite[]
  facilities: Facility[]
  selectedId: string | null
  user: { lat: number; lng: number } | null
  center: { lat: number; lng: number; zoom: number } | null
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const groupRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element || mapRef.current) return
    const map = L.map(element, { scrollWheelZoom: false }).setView([34.05, -118.25], 10)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)
    groupRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    const timer = window.setTimeout(() => map.invalidateSize(), 150)
    return () => {
      window.clearTimeout(timer)
      map.remove()
      mapRef.current = null
      groupRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const group = groupRef.current
    if (!map || !group) return
    group.clearLayers()
    for (const facility of facilities) {
      const selected = facility.id === selectedId
      const icon = L.divIcon({
        className: 'facility-pin',
        html: `<span style="display:block;width:${selected ? 18 : 14}px;height:${selected ? 18 : 14}px;border-radius:999px;background:${selected ? '#92400e' : '#1b4332'};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
        iconSize: [selected ? 18 : 14, selected ? 18 : 14],
        iconAnchor: [9, 9],
      })
      L.marker([facility.lat, facility.lng], { icon, title: facility.name, keyboard: true })
        .bindPopup(
          `<strong>${escapeHtml(facility.name)}</strong><br/>${escapeHtml(facilityTypeLabel(facility.type))}<br/>Sample data, not a verified site`,
        )
        .addTo(group)
    }
    for (const site of realSites) {
      const selected = site.id === selectedId
      const size = selected ? 20 : 15
      // Diamond pins tell real OpenStreetMap points apart from round sample pins.
      const icon = L.divIcon({
        className: 'facility-pin',
        html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:4px;transform:rotate(45deg);background:${selected ? '#92400e' : '#1e40af'};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })
      const materials = site.materials.length ? site.materials.slice(0, 6).join(', ') : 'Materials not listed'
      L.marker([site.lat, site.lng], { icon, title: site.name, keyboard: true })
        .bindPopup(`<strong>${escapeHtml(site.name)}</strong><br/>${escapeHtml(materials)}<br/>From OpenStreetMap. Confirm before you go.`)
        .addTo(group)
    }
    if (user) {
      L.circleMarker([user.lat, user.lng], {
        radius: 8,
        color: '#1b4332',
        fillColor: '#52b788',
        fillOpacity: 0.9,
      })
        .bindPopup('Your approximate location. It is used only to sort this list and is not saved.')
        .addTo(group)
    }
  }, [facilities, realSites, selectedId, user])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !center) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (motion) map.setView([center.lat, center.lng], center.zoom)
    else map.flyTo([center.lat, center.lng], center.zoom, { duration: 0.6 })
  }, [center])

  return <div ref={containerRef} className="facility-map" role="region" aria-label="Map of OpenStreetMap recycling points and sample facilities" />
}
