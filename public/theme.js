// Runs before paint (blocking) so the page never flashes the wrong theme. Kept outside the bundle for the CSP.
try {
  const t = localStorage.getItem('qrscape-theme')
  if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches))
    document.documentElement.classList.add('dark')
} catch {
  // Storage blocked: fall back to the light theme.
}
