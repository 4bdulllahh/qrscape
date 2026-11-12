import { useId, useRef, useState, type ReactNode } from 'react'

interface Tab {
  label: string
  content: ReactNode
}

/** Accessible tabs (arrow keys, Home/End). Panels stay mounted so their state (a GIF in progress) survives. */
export function Tabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const [current, setCurrent] = useState(0)
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const uid = useId()

  function go(i: number) {
    const next = (i + tabs.length) % tabs.length
    setCurrent(next)
    refs.current[next]?.focus()
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label={label}
        className="border-line bg-surface-muted flex gap-1 self-start rounded-full border p-1"
        onKeyDown={(e) => {
          const move: Record<string, number> = {
            ArrowRight: current + 1,
            ArrowLeft: current - 1,
            Home: 0,
            End: tabs.length - 1,
          }
          if (e.key in move) {
            e.preventDefault()
            go(move[e.key] ?? 0)
          }
        }}
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${uid}-tab-${i}`}
            aria-selected={i === current}
            aria-controls={`${uid}-panel-${i}`}
            tabIndex={i === current ? 0 : -1}
            onClick={() => setCurrent(i)}
            className="aria-selected:bg-surface aria-selected:text-fg aria-selected:shadow-elev-1 text-fg hover:bg-canvas focus-visible:outline-accent rounded-full px-4 py-1.5 text-sm font-medium focus-visible:outline-2"
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={tab.label}
          role="tabpanel"
          id={`${uid}-panel-${i}`}
          aria-labelledby={`${uid}-tab-${i}`}
          hidden={i !== current}
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}
