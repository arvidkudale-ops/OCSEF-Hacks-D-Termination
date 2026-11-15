import { ExternalLink } from 'lucide-react'
import { OFFICIAL_LINKS, rulesForZip } from '../data/locations'
import { useApp } from '../context/AppContext'
import { DemoNote } from './ui'

function RuleList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <h3 className="font-extrabold text-forest-900">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-ink-soft">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export function LocalRulesPanel({ compact = false }: { compact?: boolean }) {
  const { state } = useApp()
  const rules = rulesForZip(state.zip)

  if (!state.zip) {
    return (
      <DemoNote>
        Add a ZIP code to see location notes. Item guidance in this app is not a local rule.
      </DemoNote>
    )
  }

  if (!rules) {
    return (
      <div className="space-y-3 rounded-3xl bg-amber-50 p-4 ring-1 ring-amber-200">
        <p className="text-sm font-extrabold text-amber-950">No verified rules for {state.zip}</p>
        <p className="text-sm leading-6 text-amber-950">
          This demo only stores notes for a few Los Angeles County communities, and even those notes are unverified.
          Start with an official source for your address.
        </p>
        <ul className="space-y-2 text-sm">
          {OFFICIAL_LINKS.map((link) => (
            <li key={link.url}>
              <a className="inline-flex items-center gap-1 font-extrabold text-forest-900 underline" href={link.url} target="_blank" rel="noreferrer">
                {link.name}
                <ExternalLink aria-hidden size={14} />
              </a>
              <span className="text-ink-soft"> — {link.note}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const hasLists = rules.curbsideRecycling.length > 0
  return (
    <section className="space-y-4 rounded-3xl bg-white p-4 ring-1 ring-forest-900/10" aria-label="Local rules">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-2xl text-forest-900">{rules.name}</h2>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-extrabold text-amber-950">
          {rules.verified && rules.lastVerified ? `Verified ${rules.lastVerified}` : 'Unverified'}
        </span>
      </div>
      <p className="text-sm leading-6 text-ink-soft">{rules.summary}</p>
      <p className="text-sm">
        <a className="inline-flex items-center gap-1 font-extrabold text-forest-900 underline" href={rules.sourceUrl} target="_blank" rel="noreferrer">
          {rules.sourceName}
          <ExternalLink aria-hidden size={14} />
        </a>
      </p>
      {hasLists && !compact ? (
        <div className="grid gap-4 md:grid-cols-2">
          <RuleList title="Often accepted in curbside recycling" items={rules.curbsideRecycling} />
          <RuleList title="Often kept out of curbside recycling" items={rules.notAcceptedCurbside} />
          <RuleList title="Often accepted in organics" items={rules.compost} />
          <RuleList title="Often kept out of organics" items={rules.notAcceptedCompost} />
          <RuleList title="Special drop-off" items={rules.specialDropoff} />
          <RuleList title="Preparation" items={rules.preparation} />
        </div>
      ) : null}
      {!hasLists ? (
        <p className="text-sm font-bold text-forest-900">This demo does not include a material list for this city.</p>
      ) : null}
      <RuleList title="Restrictions" items={rules.restrictions} />
    </section>
  )
}
