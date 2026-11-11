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
  showQr: 'Show QR code',
  showScenery: 'Show scenery',
  hoverHint: 'Hover over the world to turn it into a QR code you can scan.',
  errorEmpty: 'Paste a link to grow your world.',
  errorTooLong: 'That link is too long for a QR code. Try a shorter one.',
} as const

export type StringKey = keyof typeof strings

export function t(key: StringKey, vars: Record<string, string | number> = {}): string {
  return strings[key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
}
