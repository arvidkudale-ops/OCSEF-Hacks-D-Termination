import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORY_META } from '../data/categories'
import { gameItemIds } from '../data/levels'
import { useApp } from '../context/AppContext'
import { uid } from '../lib/id'
import { formatKg } from '../lib/impact'
import type { WasteItem } from '../types'
import { LocalRulesPanel } from './LocalRules'
import { buttonClass, CategoryBadge } from './ui'

const usedInGame = gameItemIds()

export function ItemFacts({
  item,
  source,
  confidence,
  uncertain = false,
}: {
  item: WasteItem
  source: 'scanner' | 'database'
  confidence?: string
  uncertain?: boolean
}) {
  const { addDisposal } = useApp()
  const [logged, setLogged] = useState(0)

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-leaf-100 text-3xl" aria-hidden>
          {item.emoji}
        </div>
        <div>
          <h2 className="font-display text-3xl text-forest-900">{item.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CategoryBadge category={item.category} />
            <span className="text-sm font-bold text-ink-soft">{item.material}</span>
            {usedInGame.has(item.id) ? (
              <span className="rounded-full bg-cream-100 px-2 py-1 text-xs font-extrabold text-forest-900">In the adventure</span>
            ) : null}
          </div>
        </div>
      </div>

      {uncertain ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950" role="status">
          This result is uncertain. Search the database or check your local rules instead of treating it as a fact.
        </p>
      ) : null}

      {confidence ? (
        <p className="text-sm leading-6 text-ink-soft">
          <span className="font-extrabold text-forest-900">Confidence: </span>
          {confidence}
        </p>
      ) : null}

      <div>
        <h3 className="font-extrabold text-forest-900">Preparation</h3>
        <p className="mt-1 text-sm leading-6 text-ink-soft">{item.preparation}</p>
      </div>
      <div>
        <h3 className="font-extrabold text-forest-900">Why this category</h3>
        <p className="mt-1 text-sm leading-6 text-ink-soft">
          Recommended category: {CATEGORY_META[item.category].label}. {item.why}
        </p>
      </div>
      <div>
        <h3 className="font-extrabold text-forest-900">Environmental note</h3>
        <p className="mt-1 text-sm leading-6 text-ink-soft">{item.environmentalNote}</p>
        <p className="mt-1 text-sm text-ink-soft">Typical weight used for estimates: {formatKg(item.weightKg)}.</p>
      </div>

      <LocalRulesPanel compact />

      <div className="flex flex-wrap gap-2">
        {source === 'scanner' ? (
          <Link className={buttonClass('secondary')} to={`/database/${item.id}`}>
            Open database entry
          </Link>
        ) : null}
        <button
          className={buttonClass()}
          type="button"
          onClick={() => {
            addDisposal({ id: uid(), itemId: item.id, at: new Date().toISOString(), source })
            setLogged((count) => count + 1)
          }}
        >
          I sorted this as recommended
        </button>
      </div>
      <p className="text-sm text-ink-soft" role="status">
        {logged > 0
          ? `Logged ${logged} time${logged === 1 ? '' : 's'} in your real-world sorting record. Game points are separate.`
          : 'Logging adds this item to your real-world record. It does not change game points.'}
      </p>
    </div>
  )
}
