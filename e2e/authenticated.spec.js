import { expect, test } from '@playwright/test'

const email = process.env.E2E_USER_EMAIL
const password = process.env.E2E_USER_PASSWORD

test.describe('authenticated portal API flows', () => {
  test.skip(!email || !password, 'Set E2E_USER_EMAIL and E2E_USER_PASSWORD in .env.e2e.local')

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Audit Readiness Dashboard' })).toBeVisible()
  })

  test('creates, reloads, updates, and deletes a document through the authenticated API', async ({ page }) => {
    const marker = Date.now()
    const originalTitle = `E2E Document ${marker}`
    const updatedTitle = `${originalTitle} Updated`
    let documentId

    try {
      await page.goto('/document-library')
      await expect(page.getByRole('heading', { name: 'Document Library' })).toBeVisible()

      await page.getByLabel('Document Title').fill(originalTitle)
      await page.getByLabel('Description / Notes').fill('Automated Playwright API verification')
      await page.getByLabel('Owner Function').selectOption('HSSE')
      await page.getByLabel('Control Status').selectOption('Under Review')
      await page.getByPlaceholder('Optional repository location').fill(`/e2e/${marker}.pdf`)

      const insertResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/documents') &&
          response.request().method() === 'POST',
      )
      await page.getByRole('button', { name: 'Add Document Reference' }).click()
      const insertResponse = await insertResponsePromise
      expect(insertResponse.ok()).toBe(true)

      const insertedRows = await insertResponse.json()
      documentId = (Array.isArray(insertedRows) ? insertedRows[0] : insertedRows)?.id
      expect(documentId).toBeTruthy()
      await expect(page.getByText('Document saved successfully.')).toBeVisible()
      await expect(page.getByText(originalTitle)).toBeVisible()

      await page.reload()
      await expect(page.getByText(originalTitle)).toBeVisible()

      await page.evaluate(
        async ({ id, title }) => {
          const { updateDocument } = await import('/src/services/documentService.js')
          await updateDocument(id, { title, status: 'Approved' })
        },
        { id: documentId, title: updatedTitle },
      )
      await page.reload()
      await expect(page.getByText(updatedTitle)).toBeVisible()
      await expect(page.getByText('Approved', { exact: true })).toBeVisible()

      await page.evaluate(async (id) => {
        const { deleteDocument } = await import('/src/services/documentService.js')
        await deleteDocument(id)
      }, documentId)
      documentId = null
      await page.reload()
      await expect(page.getByText(updatedTitle)).toHaveCount(0)
    } finally {
      if (documentId) {
        await page.evaluate(async (id) => {
          const { deleteDocument } = await import('/src/services/documentService.js')
          await deleteDocument(id)
        }, documentId)
      }
    }
  })

  test('persists profile changes and restores the original profile', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible()

    const fullName = page.getByLabel('Full Name')
    const department = page.getByLabel('Department / Function')
    const original = {
      full_name: await fullName.inputValue(),
      fungsi: await department.inputValue(),
    }
    const updatedName = `E2E Profile ${Date.now()}`

    try {
      await fullName.fill(updatedName)
      await department.selectOption('HSSE')
      await page.getByRole('button', { name: 'Save Profile' }).click()
      await expect(page.getByText('Saved', { exact: true })).toBeVisible()

      await page.reload()
      await expect(page.getByLabel('Full Name')).toHaveValue(updatedName)
      await expect(page.getByLabel('Department / Function')).toHaveValue('HSSE')
    } finally {
      await page.evaluate(async (profile) => {
        const { saveCurrentProfile } = await import('/src/services/profileService.js')
        await saveCurrentProfile(profile)
      }, original)
    }
  })
})
