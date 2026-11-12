import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { SCENE_GROUPS, SCENES } from '../domain/scenes'
import { nameOf, t } from './strings'

interface Props {
  /** Scene id, or '' for the seed's own pick. */
  value: string
  /** Label of the '' choice, e.g. "Surprise me (Tree)". */
  autoLabel: string
  onChange(id: string): void
}

interface Item {
  id: string
  label: string
}

/** Scene dropdown with a search box, grouped Nature / City. Keyboard: arrows, Home/End, Enter, Escape. */
export function ScenePicker({ value, autoLabel, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const uid = useId()
  const optionId = (id: string) => `${uid}-opt-${id || 'auto'}`

  const q = query.trim().toLowerCase()
  const groups = SCENE_GROUPS.map((group) => ({
    group,
    items: SCENES.filter((s) => s.group === group)
      .map((s) => ({ id: s.id, label: nameOf('scene', s.id) }))
      .filter((s) => s.label.toLowerCase().includes(q)),
  })).filter((g) => g.items.length > 0)
  const items: Item[] = [...(q ? [] : [{ id: '', label: autoLabel }]), ...groups.flatMap((g) => g.items)]
  const current = value ? nameOf('scene', value) : autoLabel
  const activeItem = items[Math.min(active, items.length - 1)]

  function close(refocus: boolean) {
    setOpen(false)
    setQuery('')
    if (refocus) buttonRef.current?.focus()
  }

  function choose(id: string) {
    onChange(id)
    close(true)
  }

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const outside = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  useEffect(() => {
    if (open && activeItem)
      document.getElementById(optionId(activeItem.id))?.scrollIntoView({ block: 'nearest' })
  })

  function onKey(e: KeyboardEvent) {
    const last = items.length - 1
    const moves: Record<string, number> = {
      ArrowDown: Math.min(last, active + 1),
      ArrowUp: Math.max(0, active - 1),
      Home: 0,
      End: last,
    }
    if (e.key in moves) {
      e.preventDefault()
      setActive(moves[e.key] ?? 0)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeItem) choose(activeItem.id)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close(true)
    } else if (e.key === 'Tab') close(false)
  }

  function openList() {
    setActive(
      Math.max(
        0,
        items.findIndex((i) => i.id === value),
      ),
    )
    setOpen(true)
  }

  const option = (item: Item) => {
    const index = items.indexOf(item)
    const selected = item.id === value
    return (
      <li
        key={item.id || 'auto'}
        id={optionId(item.id)}
        role="option"
        aria-selected={selected}
        data-value={item.id}
        onPointerMove={() => setActive(index)}
        onClick={() => choose(item.id)}
        className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-1.5 text-sm ${
          index === active ? 'bg-surface-muted' : ''
        } ${selected ? 'text-accent font-medium' : ''}`}
      >
        {item.label}
        {selected && <span aria-hidden="true">✓</span>}
      </li>
    )
  }

  return (
    <div ref={rootRef} className="relative flex flex-col gap-2">
      <span id={`${uid}-label`} className="text-sm font-medium">
        {t('scenePicker')}
      </span>
      <button
        ref={buttonRef}
        id={`${uid}-button`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${uid}-label ${uid}-button`}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault()
            openList()
          }
        }}
        className="border-line bg-canvas text-fg focus-visible:outline-accent flex w-full items-center justify-between gap-3 rounded-full border py-2 pr-3 pl-4 text-left focus-visible:outline-2"
      >
        <span className="truncate">{current}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`text-fg-subtle size-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M5.5 7.5 10 12l4.5-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="border-line bg-surface shadow-elev-2 absolute top-full right-0 left-0 z-20 mt-2 flex flex-col gap-2 rounded-2xl border p-2">
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${uid}-list`}
            aria-autocomplete="list"
            aria-activedescendant={activeItem ? optionId(activeItem.id) : undefined}
            aria-label={t('sceneSearch')}
            placeholder={t('sceneSearch')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKey}
            className="border-line bg-canvas text-fg placeholder:text-fg-subtle focus-visible:outline-accent w-full rounded-full border px-4 py-2 text-sm focus-visible:outline-2"
          />
          <ul
            id={`${uid}-list`}
            role="listbox"
            aria-label={t('scenePicker')}
            className="flex max-h-[min(18rem,45dvh)] flex-col gap-0.5 overflow-y-auto"
          >
            {!q && option(items[0] as Item)}
            {groups.map(({ group, items: groupItems }) => (
              <li key={group} role="presentation">
                <ul role="group" aria-labelledby={`${uid}-${group}`}>
                  <li
                    role="presentation"
                    id={`${uid}-${group}`}
                    className="text-fg-subtle px-3 pt-2 pb-1 text-xs font-medium tracking-wide uppercase"
                  >
                    {t(`group_${group}`)}
                  </li>
                  {groupItems.map(option)}
                </ul>
              </li>
            ))}
            {items.length === 0 && (
              <li role="presentation" className="text-fg-subtle px-3 py-2 text-sm">
                {t('sceneNoMatch', { query: query.trim() })}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
