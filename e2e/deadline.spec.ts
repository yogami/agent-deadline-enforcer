import { test, expect } from '@playwright/test';

test.describe('Deadline Dashboard', () => {
    test('renders registration form', async ({ page }) => {
        await page.goto('/');

        // Header
        await expect(page.locator('h1')).toContainText('Agent Deadline Enforcer');

        // Form Inputs
        await expect(page.locator('input[placeholder="Agent ID"]')).toBeVisible();
        await expect(page.locator('input[placeholder="Description"]')).toBeVisible();

        // Actions
        await expect(page.getByRole('button', { name: /Register Task/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Scan Now/i })).toBeVisible();
    });

    test('can enter task description', async ({ page }) => {
        await page.goto('/');
        const descInput = page.locator('input[placeholder="Description"]');
        await descInput.fill('Urgent computation');
        await expect(descInput).toHaveValue('Urgent computation');
    });
});
