// Drives the site's scene picker (a custom listbox, not a <select>) from the browser check scripts.
const button = (page) => page.getByRole('button', { name: /^Scene/ })

/** [id, name] of every scene in the picker, without "Surprise me". */
export async function sceneList(page) {
  await button(page).click()
  const list = await page
    .locator('[role=option]')
    .evaluateAll((o) => o.map((x) => [x.dataset.value, x.textContent.replace('✓', '').trim()]))
  await page.keyboard.press('Escape')
  return list.filter(([id]) => id)
}

export async function pickScene(page, id) {
  await button(page).click()
  await page.locator(`[role=option][data-value="${id}"]`).click()
}
