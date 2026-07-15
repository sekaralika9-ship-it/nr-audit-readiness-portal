import { expect, test } from '@playwright/test'

test('redirects an anonymous visitor from a protected page to login', async ({ page }) => {
  await page.goto('/document-library')

  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByRole('heading', { name: 'Sign in to NR Audit Readiness Portal' }),
  ).toBeVisible()
})

test('renders public authentication routes without page errors', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto('/login')
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()

  await page.getByRole('link', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/signup$/)
  await expect(page.getByLabel('Full Name')).toBeVisible()

  await expect.poll(() => pageErrors).toEqual([])
})
