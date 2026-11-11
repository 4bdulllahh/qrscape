// Every on-screen string lives here so the site can be translated later.
export const strings = {
  appName: 'QRscape',
  tagline: 'Paste a link and watch it grow into a little world.',
  themeToLight: 'Switch to light theme',
  themeToDark: 'Switch to dark theme',
  themeLight: 'Light',
  themeDark: 'Dark',
} as const

export type StringKey = keyof typeof strings

export function t(key: StringKey, vars: Record<string, string | number> = {}): string {
  return strings[key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
}
