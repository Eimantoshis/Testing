# Testing Lab 3

---

## Task 3.1 – Progress Bar Synchronization

**Test ID:** LAB3_TEST_001  
**Test Case Name:** Progress Bar: Start, Complete, and Reset  
**Priority:** High  
**Description:** Verifies that the Progress Bar widget fills from 0% to 100% after clicking Start, and correctly resets back to 0% after clicking Reset.  
**Test Type:** Functional / UI  
**Author:** Eimantas  
**Creation Date:** Feb 23, 2026  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to https://demoqa.com/ | Homepage loads successfully with 'Widgets' section visible |
| 2 | Click on 'Widgets' section | Widgets menu expands showing all widget categories |
| 3 | Click 'Progress Bar' menu item | Progress Bar widget page loads with Start/Reset buttons and a progress bar at 0% |
| 4 | Inspect initial progress bar value is '0%' | Progress bar displays 0% |
| 5 | Click 'Start' button | Progress bar begins filling from 0% upward |
| 6 | Wait until progress bar reaches 100% | Progress bar completes filling; turns green |
| 7 | Inspect progress bar displays '100%' | Progress bar text content contains '100%' |
| 8 | Click 'Reset' button | Progress bar resets back to '0%'; Start button becomes available again |
| 9 | Inspect progress bar is back at '0%' | Progress bar displays '0%' |

```typescript
test('LAB3_TEST_001', async ({ page }) => {
    await page.goto("https://demoqa.com/");

    await page.locator('h5').filter({ hasText: 'Widgets' }).click();
    await page.locator('span').filter({ hasText: 'Progress Bar' }).click();

    await expect(page.locator('.progress-bar')).toHaveAttribute('aria-valuenow', '0');

    await page.locator('button#startStopButton').click();

    await expect(page.locator('.progress-bar')).toHaveAttribute('aria-valuenow', '100', { timeout: 20000 });
    await expect(page.locator('.progress-bar')).toContainText('100%');

    await page.locator('button#resetButton').click();

    await expect(page.locator('.progress-bar')).toHaveAttribute('aria-valuenow', '0');
});
```

---

## Task 3.2 – Dynamic Properties

**Test ID:** LAB3_TEST_002  
**Test Case Name:** Dynamic Properties: Timed Enable, Color Change, and Visibility  
**Priority:** High  
**Description:** Verifies three dynamic behaviours on the Dynamic Properties page: a button that becomes enabled after 5 seconds, a button that changes color after 5 seconds, and a button that becomes visible after 5 seconds.  
**Test Type:** Functional / UI  
**Author:** Eimantas  
**Creation Date:** Feb 23, 2026  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to https://demoqa.com/ | Homepage loads successfully with 'Elements' section visible |
| 2 | Click on 'Elements' section | Elements menu expands showing all element categories |
| 3 | Click 'Dynamic Properties' menu item | Dynamic Properties page loads with 3 buttons visible |
| 4 | Inspect 'Enable After 5 Seconds' button is disabled on page load | Button is present but in a disabled state and cannot be clicked |
| 5 | Wait until 'Enable After 5 Seconds' button becomes enabled | After ~5 seconds the button transitions from disabled to enabled state |
| 6 | Inspect 'Enable After 5 Seconds' button is now enabled | Button is clickable; disabled attribute is no longer present |
| 7 | Wait for 'Color Change' button to change color | Button class includes 'text-danger' indicating the color has changed to red |
| 8 | Inspect 'Color Change' button has the 'text-danger' CSS class | Button text is now rendered in red |
| 9 | Wait for 'Visible After 5 Seconds' button to appear | Button that was invisible on page load becomes visible after ~5 seconds |
| 10 | Inspect 'Visible After 5 Seconds' button is now visible | Button is displayed in the DOM and visible to the user |

```typescript
test('LAB3_TEST_002', async ({ page }) => {
    await page.goto("https://demoqa.com/");

    await page.locator('h5').filter({ hasText: 'Elements' }).click();
    await page.locator('span').filter({ hasText: 'Dynamic Properties' }).click();

    const enableAfterButton = page.locator('button#enableAfter');
    await expect(enableAfterButton).toBeDisabled();
    await expect(enableAfterButton).toBeEnabled({ timeout: 10000 });

    const colorChangeButton = page.locator('button#colorChange');
    await expect(colorChangeButton).toHaveClass(/btn-primary/);
    await expect(colorChangeButton).toHaveClass(/text-danger/, { timeout: 10000 });

    const visibleAfterButton = page.locator('button#visibleAfter');
    await expect(visibleAfterButton).toBeVisible({ timeout: 10000 });
});
```