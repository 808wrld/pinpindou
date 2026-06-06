import { test, expect } from '@playwright/test'
import { resolve } from 'node:path'

test('happy path: upload → crop → tune → export PDF', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/拼拼豆|pinpindou/)).toBeVisible()

  const fileInput = page.locator('input[type=file]')
  await fileInput.setInputFiles(resolve('e2e/fixtures/sample.png'))

  await expect(page).toHaveURL(/#\/crop/)

  await page.getByRole('button', { name: /下一步|Next/ }).click()
  await expect(page).toHaveURL(/#\/tune/)

  await page.waitForSelector('canvas', { timeout: 30_000 })

  await page.getByRole('button', { name: /下一步|Next/ }).click()
  await expect(page).toHaveURL(/#\/export/)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /下载 PDF|Download PDF/ }).click()
  const download = await downloadPromise
  const path = await download.path()
  expect(path).toBeTruthy()
})
