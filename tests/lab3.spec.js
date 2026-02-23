import {test, expect} from '@playwright/test';

test('LAB3_TEST_001', async ({page}) => {
    await page.goto("https://demoqa.com/");

    await page.locator('h5').filter({ hasText: 'Widgets'}).click();
    await page.locator('span').filter({ hasText: 'Progress Bar'}).click();

    await expect(page.locator('.progress-bar')).toHaveAttribute('aria-valuenow', '0');

    await page.locator('button#startStopButton').click();

    await expect(page.locator('.progress-bar')).toHaveAttribute('aria-valuenow', '100', { timeout: 20000});
    await expect(page.locator('.progress-bar')).toContainText('100%');

    await page.locator('button#resetButton').click();

    await expect(page.locator('.progress-bar')).toHaveAttribute('aria-valuenow', '0');

});

test('LAB3_TEST_002', async ({ page }) => {
    await page.goto("https://demoqa.com/");

    await page.locator('h5').filter({ hasText: 'Elements'}).click();
    await page.locator('span').filter({ hasText: 'Dynamic Properties'}).click();

    const enableAfterButton = page.locator('button#enableAfter');
    await expect(enableAfterButton).toBeDisabled();
    await expect(enableAfterButton).toBeEnabled({ timeout: 10000 });

    const colorChangeButton = page.locator('button#colorChange');
    await expect(colorChangeButton).toHaveClass(/btn-primary/);
    await expect(colorChangeButton).toHaveClass(/text-danger/, { timeout: 10000 });

    const visibleAfterButton = page.locator('button#visibleAfter');
    await expect(visibleAfterButton).toBeVisible({ timeout: 10000 });
});