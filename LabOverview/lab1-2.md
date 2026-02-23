# Testing Lab 1 & 2

---

## Task 1 & 2 – E-Commerce Workflow

**Test ID:** ECOM_TEST_001  
**Test Case Name:** End-to-End: Registration, Cart Management, and Product Configuration  
**Priority:** High  
**Description:** Validates complete user journey from registration through product configuration and cart management, covering main e-commerce flow.  
**Test Type:** End-to-End  
**Preconditions:**
- "Computers" category exists with "Desktops", "Notebooks", "Accessories" subcategories
- "Build your own expensive computer" product exists with base price > 900
- "Fast" processor upgrade option exists (+100) for "Build your own expensive computer"

**Test Data:**
- `unique_email` — unique alphanumeric email, e.g. `testUser{RandomID}@test.com` where RandomID is a random number (1–100000)
- `password` — at least 6 characters, e.g. `password`

**Author:** Eimantas  
**Creation Date:** Feb 4, 2026  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to https://demowebshop.tricentis.com/ | Homepage loads with "Demo Web Shop" title visible |
| 2 | Click on "Register" | Registration page displays with form fields |
| 3 | Enter "firstName1" in "First name" field | "firstName1" appears in "First name" field |
| 4 | Enter "lastName1" in "Last name" field | "lastName1" appears in "Last name" field |
| 5 | Enter unique_email in "Email" input field | unique_email appears in "Email" field |
| 6 | Enter "password" in "Password" field | Password field shows 8 masked asterisk characters |
| 7 | Enter "password" in "Confirm password" field | Confirm password field shows 8 masked asterisk characters |
| 8 | Click "Register" button | Success message appears, user is logged in |
| 9 | Click "Continue" button | Redirected to homepage, unique_email visible in header |
| 10 | Hover over "Computers" in main menu | Dropdown shows: "Desktops", "Notebooks", "Accessories" |
| 11 | Click "Desktops" subcategory | Desktop products page displays with product grid |
| 12 | Filter products with price > 900 using XPath | Only products with price greater than 900 are selected |
| 13 | Inspect the price of "Build your own expensive computer" | Price is visible and greater than 900 |
| 14 | Click "Build your own expensive computer" | Product detail page loads with configuration options |
| 15 | Click "Add to cart" button | Green notification bar: "The product has been added to your shopping cart" |
| 16 | Click "Shopping cart" in the header | Shopping cart page displays with added item |
| 17 | Inspect that quantity is 1 | Quantity field displays '1' |
| 18 | Change quantity to "2" | Quantity field updates to "2", price unchanged |
| 19 | Click "Update shopping cart" | Total = 2 × unit price (both price and quantity are updated) |
| 20 | Click "Edit" button next to product | Redirected to product configuration page |
| 21 | Click "Fast" radio button in the "Processor" field | "Fast [+100.00]" radio button is selected |
| 22 | Click "Add to cart" button | Green notification: "The product has been added to your shopping cart" |
| 23 | Click "Shopping cart" | Cart displays updated configuration |
| 24 | Inspect final total | Total = 2 × (original unit price + 100.00) |

```typescript
import { test, expect } from '@playwright/test';

test('ECOM_TEST_001', async ({ page }) => {
    await page.goto("https://demowebshop.tricentis.com/")

    await page.getByRole('link', { name: 'Register' }).click();

    const firstName = 'firstName1';
    const lastName = 'lastName1';
    const randomID = Math.floor(Math.random() * 100000);
    const email = `user${randomID}@example.com`;
    const password = 'password';

    await page.locator('input#FirstName').fill(firstName);
    await page.locator('input#LastName').fill(lastName);
    await page.locator('input#Email').fill(email);
    await page.locator('input#Password').fill(password);
    await page.locator('input#ConfirmPassword').fill(password);

    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.locator('.result')).toContainText('Your registration completed');

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('a.account').first()).toHaveText(email);

    await page.locator('.top-menu').getByRole('link', { name: 'Computers' }).hover();

    const dropdown = page.locator('.top-menu li').filter({ hasText: 'Computers' }).locator('ul.sublist');
    await expect(dropdown.getByRole('link', { name: 'Desktops' })).toBeVisible();
    await expect(dropdown.getByRole('link', { name: 'Notebooks' })).toBeVisible();
    await expect(dropdown.getByRole('link', { name: 'Accessories' })).toBeVisible();

    await dropdown.getByRole('link', { name: 'Desktops' }).click();
    await expect(page.locator('div.page-title h1')).toHaveText('Desktops');

    const productItems = page.locator('.product-item');
    await expect(productItems.first()).toBeVisible();

    // Filter products with price > 900 using XPath
    const expensiveProductsXPath = '//div[@class="product-item"][.//span[contains(@class, "actual-price") and number(text()) > 900]]';
    const expensiveProducts = page.locator(`xpath=${expensiveProductsXPath}`);

    const products = await expensiveProducts.evaluateAll((items) =>
        items.map((item) => {
            const nameEl  = item.querySelector('.product-title a');
            const priceEl = item.querySelector('.price.actual-price');
            return {
                name : nameEl  ? nameEl.textContent.trim()  : '',
                price: priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) : 0,
            };
        })
    );

    let expensivePc;
    products.sort((a, b) => b.price - a.price);
    for (const product of products) {
        if (product.name === 'Build your own expensive computer') {
            expensivePc = product;
        }
    }

    expect(expensivePc.price).toBeGreaterThan(900);

    await page.locator('.product-item .product-title a')
        .filter({ hasText: expensivePc.name })
        .first()
        .click();

    await expect(page.locator('.product-name [itemprop="name"]')).toHaveText(expensivePc.name);

    const basePriceText = await page.locator('.product-price span').first().textContent();
    const basePrice = parseFloat(basePriceText.replace(/[^0-9.]/g, ''));

    // Price at the bottom doesn't take into account the auto selected options
    const selectedOptions = await page.locator('input[type="radio"]:checked').evaluateAll(nodes => {
        return nodes.map(node => {
            const label = node.closest('li')?.textContent || '';
            const cleanLabel = label.replace(/\s+/g, ' ').trim();
            const priceMatch = cleanLabel.match(/\[([+-]?\d+(?:\.\d+)?)\]/);
            const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
            return price;
        });
    });
    const optionsTotal = selectedOptions.reduce((sum, price) => sum + price, 0);
    const actualPrice = basePrice + optionsTotal;

    await page.locator("input.add-to-cart-button").click();

    const notification = page.locator('#bar-notification');
    await expect(notification).toBeVisible();
    await expect(notification).toContainText('The product has been added to your shopping cart');

    await page.locator('.ico-cart').first().click();
    await expect(page.locator('div.page-title h1')).toHaveText('Shopping cart');

    const qtyInput = page.locator('input.qty-input').first();
    await expect(qtyInput).toHaveValue('1');

    await qtyInput.fill('2');
    await expect(qtyInput).toHaveValue('2');

    await page.getByRole('button', { name: 'Update shopping cart' }).click();

    const updatedQty = page.locator('input.qty-input').first();
    await expect(updatedQty).toHaveValue('2');

    const subTotalText = await page.locator('.product-subtotal').first().textContent();
    const subTotal = parseFloat(subTotalText.replace(/[^0-9.]/g, ''));

    expect(subTotal).toBeCloseTo(actualPrice * 2, 1);

    await page.locator('div.edit-item a').first().click();
    await expect(page.locator('.product-name [itemprop="name"]')).toHaveText(expensivePc.name);

    const fastLabel = page.locator('label').filter({ hasText: /Fast/i });
    const fastRadioId = await fastLabel.getAttribute('for');
    const fastRadio = page.locator(`input#${fastRadioId}`);
    await fastRadio.click();
    await expect(fastRadio).toBeChecked();

    const newBasePriceText = await page.locator('.product-price span').first().textContent();
    const newBasePrice = parseFloat(newBasePriceText.replace(/[^0-9.]/g, ''));

    const newSelectedOptions = await page.locator('input[type="radio"]:checked').evaluateAll(nodes => {
        return nodes.map(node => {
            const label = node.closest('li')?.textContent || '';
            const cleanLabel = label.replace(/\s+/g, ' ').trim();
            const priceMatch = cleanLabel.match(/\[([+-]?\d+(?:\.\d+)?)\]/);
            const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
            return price;
        });
    });
    const newOptionsTotal = newSelectedOptions.reduce((sum, price) => sum + price, 0);
    const newActualPrice = newBasePrice + newOptionsTotal;

    await page.locator("input.add-to-cart-button").click();

    const notification2 = page.locator('#bar-notification');
    await expect(notification2).toBeVisible();
    await expect(notification2).toContainText('The product has been added to your shopping cart');

    await page.locator('.ico-cart').first().click();
    await expect(page.locator('div.page-title h1')).toHaveText('Shopping cart');

    const finalSubTotalText = await page.locator('.product-subtotal').first().textContent();
    const finalSubTotal = parseFloat(finalSubTotalText.replace(/[^0-9.]/g, ''));

    const expectedFinalTotal = 2 * newActualPrice;

    expect(finalSubTotal).toBeCloseTo(expectedFinalTotal, 1);
});
```

---

## Task 2.2 – Web Tables Pagination

**Test ID:** LAB2_TEST_002  
**Test Case Name:** Web Tables: Add Rows Until Pagination, Navigate, and Delete  
**Priority:** High  
**Description:** Adds enough records to the Web Tables widget to trigger a second page in pagination, navigates to that page, deletes a record, and verifies pagination automatically returns to a single page.  
**Test Type:** Functional / UI  
**Preconditions:** Browser is open; demoqa.com is accessible; Web Tables contains the default 3 pre-existing rows.  
**Test Data:** Dynamically generated per iteration — First{i}, Last{i}, user{i}@example.com, age 20+i, salary 100+i, Department{i}  
**Author:** Eimantas  
**Creation Date:** Feb 4, 2026  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to https://demoqa.com/ | Homepage loads successfully |
| 2 | Click on 'Elements' section | Elements menu expands showing all element categories |
| 3 | Click 'Web Tables' menu item | Web Tables page loads with the default 3-row table and pagination controls |
| 4 | Click 'Add' button | Registration form modal opens |
| 5 | Fill in First Name, Last Name, Email, Age, Salary, Department with generated data | All fields are populated with the generated values |
| 6 | Click 'Submit' button | Modal closes; new row appears in the table |
| 7 | Check if 'Next' button is enabled | If enabled, a second page exists — stop adding rows; if not, repeat from step 4 |
| 8 | Inspect pagination shows 'Page 1 of 2' | Pagination control displays "Page 1 of 2" |
| 9 | Click 'Next' button | Table navigates to page 2 showing the overflow rows |
| 10 | Click the 'Delete' icon on the first row of page 2 | Row is removed from the table |
| 11 | Inspect pagination shows 'Page 1 of 1' | Pagination automatically returns to page 1 and control displays "Page 1 of 1" |

```typescript
test('LAB2_TEST_002', async ({ page }) => {
    await page.goto("https://demoqa.com/");

    await page.locator('h5').filter({ hasText: 'Elements' }).click();
    await page.locator('span').filter({ hasText: 'Web Tables' }).click();

    const nextButton = page.getByText('Next');

    for (let i = 0; i < 100; i++) {
        await page.locator('button#addNewRecordButton').filter({ hasText: 'Add' }).click();
        const firstName = `First${i}`;
        const lastName = `Last${i}`;
        const email = `user${i}@example.com`;
        const age = (20 + i).toString();
        const salary = 100 + i;
        const department = `Department${i}`;
        await page.getByPlaceholder('First Name').fill(firstName);
        await page.getByPlaceholder('Last Name').fill(lastName);
        await page.getByPlaceholder('name@example.com').fill(email);
        await page.getByPlaceholder('Age').fill(age);
        await page.getByPlaceholder('Salary').fill(salary.toString());
        await page.getByPlaceholder('Department').fill(department);
        await page.getByRole('button', { name: 'submit' }).click();

        await page.locator('.modal[role="dialog"]').waitFor({ state: 'hidden' });

        if (await nextButton.isEnabled()) {
            break;
        }
    }

    await expect(page.locator('.col-auto').filter({ hasText: 'Page' })).toContainText('Page 1 of 2');
    await nextButton.click();

    await page.locator('table tbody tr').first()
        .locator('span[title="Delete"]').click();

    await expect(page.locator('.col-auto').filter({ hasText: 'Page' })).toContainText('Page 1 of 1');
});
```