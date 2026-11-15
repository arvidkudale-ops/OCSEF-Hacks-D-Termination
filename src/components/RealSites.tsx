import { useMemo, useRef, useState } from 'react'
import { distanceKm } from '../data/facilities'
import { ZIP_CENTERS } from '../data/locations'
import { fetchRealSites } from '../lib/overpass'
import type { RealSite } from '../lib/overpass'
import { useApp } from '../context/AppContext'
import { buttonClass, Card, DemoNote, EmptyState } from './ui'

type Point = { lat: number; lng: number }

function safeUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

export function RealSitesPanel({
  user,
  requestLocation,
  sites,
  onSites,
  selectedId,
  onShow,
}: {
  user: Point | null
  requestLocation: () => Promise<Point | null>
  sites: RealSite[]
  onSites: (sites: RealSite[], origin: Point) => void
  selectedId: string | null
  onShow: (site: RealSite) => void
}) {
  const { state } = useApp()
  const [radiusKm, setRadiusKm] = useState(5)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [origin, setOrigin] = useState<(Point & { label: string }) | null>(null)
  const [material, setMaterial] = useState('all')
  const controllerRef = useRef<AbortController | null>(null)
  const zipCenter = state.zip ? ZIP_CENTERS[state.zip] : undefined

  async function search(point: Point, label: string) {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setLoading(true)
    setMaterial('all')
    setStatus(`Searching OpenStreetMap within ${radiusKm} km of ${label}…`)
    try {
      const found = await fetchRealSites(point.lat, point.lng, radiusKm * 1000, controller.signal)
      const sorted = [...found].sort((a, b) => distanceKm(point, a) - distanceKm(point, b))
      setOrigin({ ...point, label })
      onSites(sorted, point)
      setStatus(
        sorted.length
          ? `${sorted.length} mapped recycling point${sorted.length === 1 ? '' : 's'} within ${radiusKm} km of ${label}.`
          : `OpenStreetMap has no recycling points within ${radiusKm} km of ${label}. Try a larger radius or your city's site.`,
      )
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setStatus('OpenStreetMap could not be reached right now. Try again in a minute, or use the official links above.')
    } finally {
      if (controllerRef.current === controller) setLoading(false)
    }
  }

  async function searchNearMe() {
    const point = user ?? (await requestLocation())
    if (point) await search(point, 'your location')
  }

  const materials = useMemo(() => [...new Set(sites.flatMap((site) => site.materials))].sort(), [sites])
  const shown = material === 'all' ? sites : sites.filter((site) => site.materials.includes(material))

  return (
    <section className="space-y-4" aria-labelledby="real-sites-heading">
      <div>
        <h2 id="real-sites-heading" className="font-display text-3xl text-forest-900">
          Real drop-off points near you
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
          These come live from OpenStreetMap, where volunteers map recycling containers and centers. Coverage is uneven and details can be out of
          date, so confirm hours and accepted materials with the operator before you go.
        </p>
      </div>
      <Card className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="real-radius" className="text-sm font-extrabold">
              Search radius
            </label>
            <select
              id="real-radius"
              className="mt-2 block min-h-11 rounded-2xl border border-forest-900/15 bg-white px-3"
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
            >
              {[2, 5, 10, 20].map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
            </select>
          </div>
          <button className={buttonClass()} type="button" disabled={loading} onClick={() => void searchNearMe()}>
            {loading ? 'Searching…' : 'Search near my location'}
          </button>
          {zipCenter ? (
            <button
              className={buttonClass('secondary')}
              type="button"
              disabled={loading}
              onClick={() => void search(zipCenter, `${zipCenter.label} (${state.zip})`)}
            >
              Search near {state.zip}
            </button>
          ) : null}
        </div>
        <p className="text-xs text-ink-soft">
          Searching sends an approximate point (not your address) to the public OpenStreetMap Overpass service. D-Trashify does not save it.
        </p>
        {status ? (
          <p className="text-sm text-ink-soft" role="status">
            {status}
          </p>
        ) : null}
        {materials.length > 1 ? (
          <div>
            <p className="text-sm font-extrabold">Accepts</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={material === 'all' ? buttonClass() : buttonClass('secondary')} onClick={() => setMaterial('all')}>
                Anything
              </button>
              {materials.map((entry) => (
                <button key={entry} type="button" className={material === entry ? buttonClass() : buttonClass('secondary')} onClick={() => setMaterial(entry)}>
                  {entry}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      {origin && shown.length === 0 && sites.length > 0 ? <EmptyState title="None accept that material">Pick another material or widen the search.</EmptyState> : null}

      {shown.length > 0 ? (
        <>
          <DemoNote>Live community data. Not checked by D-Trashify. Confirm with the operator before dropping anything off.</DemoNote>
          <ul className="grid gap-3 lg:grid-cols-2">
            {shown.slice(0, 40).map((site) => {
              const website = safeUrl(site.website)
              return (
                <li key={site.id}>
                  <article className={`h-full rounded-3xl bg-white p-4 ring-1 ${site.id === selectedId ? 'ring-2 ring-amber-700' : 'ring-forest-900/10'}`}>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-blue-800">OpenStreetMap</p>
                    <h3 className="mt-1 font-display text-xl text-forest-900">{site.name}</h3>
                    {origin ? <p className="text-sm font-bold text-forest-900">About {distanceKm(origin, site).toFixed(1)} km away</p> : null}
                    <p className="mt-2 text-sm text-ink-soft">
                      <span className="font-extrabold text-forest-900">Mapped as accepting: </span>
                      {site.materials.length ? site.materials.join(', ') : 'not listed'}
                    </p>
                    {site.hours ? <p className="mt-1 text-sm text-ink-soft">Listed hours: {site.hours} (unverified)</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className={buttonClass('secondary')} type="button" onClick={() => onShow(site)}>
                        Show on map
                      </button>
                      <a
                        className={buttonClass('ghost')}
                        href={`https://www.google.com/maps/dir/?api=1&destination=${site.lat},${site.lng}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Directions
                      </a>
                      {website ? (
                        <a className={buttonClass('ghost')} href={website} target="_blank" rel="noreferrer noopener">
                          Website
                        </a>
                      ) : null}
                      <a className={buttonClass('ghost')} href={site.osmUrl} target="_blank" rel="noreferrer">
                        Fix on OSM
                      </a>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        </>
      ) : null}
    </section>
  )
}
