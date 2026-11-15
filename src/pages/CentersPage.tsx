import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  FACILITIES,
  FACILITY_MATERIALS,
  FACILITY_TYPES,
  distanceKm,
  facilityTypeLabel,
} from "../data/facilities";
import type { FacilityType } from "../data/facilities";
import { ZIP_CENTERS, normalizeZip, rulesForZip } from "../data/locations";
import { usePrefersReducedMotion } from "../lib/motion";
import { FacilityMap } from "../components/FacilityMap";
import { LocalRulesPanel } from "../components/LocalRules";
import { RealSitesPanel } from "../components/RealSites";
import type { RealSite } from "../lib/overpass";
import { ZipField } from "../components/ZipField";
import {
  buttonClass,
  Card,
  DemoNote,
  EmptyState,
  PageHeader,
} from "../components/ui";

/** Local rules, the sample facility list, and the map. */
export function CentersPage() {
  const location = useLocation();
  const reduceMotion = usePrefersReducedMotion();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | FacilityType>("all");
  const [material, setMaterial] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [user, setUser] = useState<{ lat: number; lng: number } | null>(null);
  const [geoMessage, setGeoMessage] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [placeMessage, setPlaceMessage] = useState("");
  const [center, setCenter] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);
  const [realSites, setRealSites] = useState<RealSite[]>([]);

  useEffect(() => {
    if (location.hash !== "#local-rules") return;
    document
      .getElementById("local-rules")
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }, [location.hash, reduceMotion]);

  const facilities = useMemo(() => {
    const term = query.trim().toLowerCase();
    const rows = FACILITIES.filter((facility) => {
      if (type !== "all" && facility.type !== type) return false;
      if (material !== "all" && !facility.materials.includes(material))
        return false;
      if (!term) return true;
      return [
        facility.name,
        facility.area,
        facility.zip,
        facility.type,
        ...facility.materials,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
    if (!user) return rows;
    return [...rows].sort((a, b) => distanceKm(user, a) - distanceKm(user, b));
  }, [query, type, material, user]);

  function searchPlace(event: { preventDefault: () => void }) {
    event.preventDefault();
    const zip = normalizeZip(query);
    if (zip && ZIP_CENTERS[zip]) {
      const place = ZIP_CENTERS[zip];
      setCenter({ lat: place.lat, lng: place.lng, zoom: 13 });
      setPlaceMessage(
        `Map centered on ${place.label}. Pins are still sample data.`,
      );
      return;
    }
    if (zip) {
      const rules = rulesForZip(zip);
      if (rules) {
        setCenter({ ...rules.center, zoom: 12 });
        setPlaceMessage(
          `Map centered near ${rules.name}. This demo may not have a pin in that city.`,
        );
        return;
      }
      setPlaceMessage(
        "No map center is stored for that ZIP. The sample directory is still below.",
      );
      return;
    }
    const match = facilities[0];
    if (match && query.trim()) {
      setSelectedId(match.id);
      setCenter({ lat: match.lat, lng: match.lng, zoom: 13 });
      setPlaceMessage(
        `Showing the first sample pin that matches “${query.trim()}”.`,
      );
      return;
    }
    setPlaceMessage(
      "Enter a ZIP code or a word such as organics, e-waste, or Echo Park.",
    );
  }

  function locate(): Promise<{ lat: number; lng: number } | null> {
    if (!navigator.geolocation) {
      setGeoMessage(
        "This browser does not provide location. Search by ZIP instead.",
      );
      return Promise.resolve(null);
    }
    setGeoLoading(true);
    setGeoMessage("Asking for permission…");
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUser(next);
          setCenter({ ...next, zoom: 12 });
          setGeoLoading(false);
          setGeoMessage("Location is on for this visit only. It is not saved.");
          resolve(next);
        },
        () => {
          setGeoLoading(false);
          setGeoMessage(
            "Location permission was denied. Search by ZIP or city instead.",
          );
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
      );
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Find where it goes"
        title="Recycling centers"
        description="Read location notes, find real recycling points mapped on OpenStreetMap, and browse a sample directory of facility types."
      />

      <section id="local-rules" className="space-y-4">
        <h2 className="font-display text-3xl text-forest-900">Local rules</h2>
        <Card>
          <ZipField id="centers-zip" />
        </Card>
        <LocalRulesPanel />
      </section>

      <RealSitesPanel
        user={user}
        requestLocation={locate}
        sites={realSites}
        selectedId={selectedId}
        onSites={(sites, origin) => {
          setRealSites(sites);
          setCenter({ ...origin, zoom: 13 });
        }}
        onShow={(site) => {
          setSelectedId(site.id);
          setCenter({ lat: site.lat, lng: site.lng, zoom: 16 });
          document
            .querySelector(".facility-map")
            ?.scrollIntoView({
              behavior: reduceMotion ? "auto" : "smooth",
              block: "center",
            });
        }}
      />

      <div className="space-y-2">
        <FacilityMap
          facilities={facilities}
          realSites={realSites}
          selectedId={selectedId}
          user={user}
          center={center}
        />
        <p className="text-xs text-ink-soft">
          Blue diamonds are OpenStreetMap recycling points. Round green dots are
          sample pins from the directory below.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-3xl text-forest-900">
            Sample directory
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
            Map tiles come from OpenStreetMap. Every pin is sample data placed
            in a public area. Hours and phone numbers are omitted because they
            were not verified.
          </p>
        </div>
        <DemoNote>
          Sample facility data. Do not visit these coordinates expecting a
          drop-off site.
        </DemoNote>
        <Card className="space-y-4">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={searchPlace}
          >
            <div className="flex-1">
              <label htmlFor="place-search" className="text-sm font-extrabold">
                ZIP or keyword
              </label>
              <input
                id="place-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="90026, compost, electronics…"
                className="mt-2 min-h-11 w-full rounded-2xl border border-forest-900/15 px-3"
              />
            </div>
            <div className="flex items-end gap-2">
              <button className={buttonClass()} type="submit">
                Search
              </button>
              <button
                className={buttonClass("secondary")}
                type="button"
                onClick={() => void locate()}
                disabled={geoLoading}
              >
                {geoLoading ? "Locating…" : "Use my location"}
              </button>
            </div>
          </form>
          <div>
            <label htmlFor="facility-type" className="text-sm font-extrabold">
              Facility type
            </label>
            <select
              id="facility-type"
              className="mt-2 min-h-11 w-full rounded-2xl border border-forest-900/15 bg-white px-3 sm:max-w-xs"
              value={type}
              onChange={(event) =>
                setType(event.target.value as "all" | FacilityType)
              }
            >
              <option value="all">All types</option>
              {FACILITY_TYPES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-sm font-extrabold">Accepted material</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className={
                  material === "all" ? buttonClass() : buttonClass("secondary")
                }
                onClick={() => setMaterial("all")}
              >
                Any
              </button>
              {FACILITY_MATERIALS.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  className={
                    material === entry
                      ? buttonClass()
                      : buttonClass("secondary")
                  }
                  onClick={() => setMaterial(entry)}
                >
                  {entry}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-ink-soft" role="status">
            {placeMessage || geoMessage || `${facilities.length} sample places`}
          </p>
          {geoMessage && placeMessage ? (
            <p className="text-sm text-ink-soft">{geoMessage}</p>
          ) : null}
        </Card>

        {facilities.length === 0 ? (
          <EmptyState title="No sample places match">
            Clear the type or material filter, or try a shorter search.
          </EmptyState>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {facilities.map((facility) => (
              <li key={facility.id}>
                <article className="h-full rounded-3xl bg-white p-4 ring-1 ring-forest-900/10">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-amber-800">
                    Sample data
                  </p>
                  <h3 className="mt-1 font-display text-2xl text-forest-900">
                    {facility.name}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-ink-soft">
                    {facilityTypeLabel(facility.type)} · {facility.area}{" "}
                    {facility.zip}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">
                    {facility.note}
                  </p>
                  <p className="mt-2 text-sm text-ink-soft">
                    <span className="font-extrabold text-forest-900">
                      Materials in this sample:{" "}
                    </span>
                    {facility.materials.join(", ")}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    Hours: not verified, so none are shown.
                  </p>
                  <p className="text-sm text-ink-soft">
                    Phone: not verified, so none is shown.
                  </p>
                  {user ? (
                    <p className="mt-1 text-sm font-bold text-forest-900">
                      About {distanceKm(user, facility).toFixed(1)} km from your
                      location
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className={buttonClass("secondary")}
                      type="button"
                      onClick={() => {
                        setSelectedId(facility.id);
                        setCenter({
                          lat: facility.lat,
                          lng: facility.lng,
                          zoom: 14,
                        });
                      }}
                    >
                      Show on map
                    </button>
                    <a
                      className={buttonClass("ghost")}
                      href={`https://www.google.com/maps/search/?api=1&query=${facility.lat},${facility.lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open sample pin in maps
                    </a>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
