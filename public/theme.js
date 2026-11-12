// Runs before paint (blocking) so the page never flashes the wrong theme. Kept outside the bundle for the CSP.
// Light by default; dark only when the visitor picked it.
try {
  if (localStorage.getItem('qrscape-theme') === 'dark') document.documentElement.classList.add('dark')
} catch {
  // Storage blocked: stay light.
}
