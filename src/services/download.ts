/** Saves a file through a temporary link. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  // Give the browser a moment to start the download before freeing the memory.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** "https://www.example.com/a" -> "qrscape-example-com". */
export function fileBaseName(link: string): string {
  let host = link
  try {
    host = new URL(link).hostname
  } catch {
    // Not a URL (plain text): use the text itself.
  }
  const slug = host
    .replace(/^www\./, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return slug ? `qrscape-${slug}` : 'qrscape'
}
