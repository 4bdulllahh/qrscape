import { useState } from 'react'
import { EMBED_SIZES, embedCode, MAX_SIZE, MIN_SIZE, parseSize } from '../domain/embedCode'
import { t } from './strings'

interface Props {
  link: string
  sceneId: string
  paletteId: string
  reroll: number
}

type SizeName = keyof typeof EMBED_SIZES
const SIZE_LABEL = { small: 'sizeSmall', medium: 'sizeMedium', large: 'sizeLarge' } as const

/** The copy-paste code for people's own websites. */
export function EmbedPanel({ link, sceneId, paletteId, reroll }: Props) {
  // Raw text of the size box; parseSize keeps the code within MIN_SIZE..MAX_SIZE while typing.
  const [px, setPx] = useState(String(EMBED_SIZES.medium))
  const size = parseSize(px)
  const [status, setStatus] = useState<'' | 'copied' | 'copyFailed'>('')
  const code = embedCode(location.origin, { link, sceneId, paletteId, reroll, size })

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setStatus('copied')
    } catch (error) {
      console.error('Copy to clipboard failed', error)
      setStatus('copyFailed')
    }
  }

  return (
    <section aria-labelledby="embed-title" className="flex w-full flex-col gap-3">
      <h2 id="embed-title" className="text-lg font-semibold">
        {t('embedTitle')}
      </h2>
      <p className="text-fg-subtle text-sm">{t('embedHelp')}</p>
      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="sr-only">{t('sizePicker')}</legend>
        {(Object.keys(EMBED_SIZES) as SizeName[]).map((name) => (
          <label
            key={name}
            className="border-line has-checked:border-accent has-checked:bg-canvas has-focus-visible:outline-accent cursor-pointer rounded-full border px-3 py-1.5 text-sm has-focus-visible:outline-2"
          >
            <input
              type="radio"
              name="embed-size"
              checked={size === EMBED_SIZES[name]}
              onChange={() => {
                setPx(String(EMBED_SIZES[name]))
                setStatus('')
              }}
              className="sr-only"
            />
            {t(SIZE_LABEL[name], { px: EMBED_SIZES[name] })}
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm">
          {t('sizeCustom')}
          <input
            type="number"
            inputMode="numeric"
            min={MIN_SIZE}
            max={MAX_SIZE}
            step={10}
            value={px}
            onChange={(e) => {
              setPx(e.target.value)
              setStatus('')
            }}
            onBlur={() => setPx(String(size))}
            aria-describedby="embed-size-range"
            className="border-line bg-canvas text-fg focus-visible:outline-accent w-24 rounded-full border px-3 py-1.5 text-sm focus-visible:outline-2"
          />
          px
        </label>
      </fieldset>
      <p id="embed-size-range" className="text-fg-subtle -mt-1 text-xs">
        {t('sizeRange', { min: MIN_SIZE, max: MAX_SIZE })}
      </p>
      <pre
        className="border-line bg-canvas max-h-36 overflow-y-auto rounded-2xl border p-4 text-xs leading-relaxed break-all whitespace-pre-wrap"
        tabIndex={0}
      >
        <code>{code}</code>
      </pre>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={copy}
          className="bg-fg text-surface shadow-elev-1 focus-visible:outline-accent rounded-full px-5 py-2 text-sm hover:opacity-90 focus-visible:outline-2"
        >
          {t('copyCode')}
        </button>
        <span role="status" className="text-fg-subtle text-sm">
          {status && t(status)}
        </span>
      </div>
      <p className="text-fg-subtle text-xs">{t('embedLoopHint')}</p>
    </section>
  )
}
