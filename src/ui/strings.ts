// Every on-screen string lives here so the site can be translated later.
export const strings = {
  appName: 'QRscape',
  tagline: 'Paste a link and watch it grow into a little world.',
  themeToLight: 'Switch to light theme',
  themeToDark: 'Switch to dark theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  linkLabel: 'Your link',
  sceneLabel: 'A small 3D world built from your link. Hover or focus it to see the QR code.',
  loadingScene: 'Growing your world...',
  showQr: 'Show QR code',
  showScenery: 'Show scenery',
  reroll: 'Grow another one',
  hoverHint: 'Hover over the world to turn it into a QR code you can scan.',
  errorEmpty: 'Paste a link to grow your world.',
  errorTooLong: 'That link is too long for a QR code. Try a shorter one.',
  scenePicker: 'Scene',
  moodPicker: 'Mood',
  auto: 'Surprise me ({name})',
  scene_tree: 'Tree',
  palette_day: 'Day',
  palette_blossom: 'Blossom',
  palette_autumn: 'Autumn',
  palette_dusk: 'Dusk',
  palette_night: 'Night',
} as const

export type StringKey = keyof typeof strings

export function t(key: StringKey, vars: Record<string, string | number> = {}): string {
  return strings[key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
}

/** Display name of a scene or palette id. */
export function nameOf(kind: 'scene' | 'palette', id: string): string {
  const key = `${kind}_${id}`
  return key in strings ? strings[key as StringKey] : id
}
