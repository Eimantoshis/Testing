import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';


const testData = JSON.parse(
  readFileSync('./data/lab4.json', 'utf-8')
);

// HELPER
function generateEmail() {
  const randomID = Math.floor(Math.random() * 100000);
  return `${testData.user.emailPrefix}${randomID}${testData.user.emailDomain}`;
}

// PRECONDITION
async function registerAndLogin(page, email) {
  await page.goto(testData.navigation.baseUrl);
  await page.getByRole('link', { name: 'Register' }).click();

  await page.locator('input#FirstName').fill(testData.user.firstName);
  await page.locator('input#LastName').fill(testData.user.lastName);
  await page.locator('input#Email').fill(email);
  await page.locator('input#Password').fill(testData.user.passwordBase);
  await page.locator('input#ConfirmPassword').fill(testData.user.passwordBase);

  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.locator('.result')).toContainText('Your registration completed');

  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('a.account').first()).toHaveText(email);
}

// PRECONDITION
async function ensureCartEmpty(page) {
  await page.goto(`${testData.navigation.baseUrl}cart`);

  const removeCheckboxes = page.locator('input[name="removefromcart"]');
  const count = await removeCheckboxes.count();

  if (count > 0) {
    for (let i = 0; i < count; i++) {
      await removeCheckboxes.nth(i).check();
    }
    await page.getByRole('button', { name: 'Update shopping cart' }).click();
    await page.waitForLoadState('networkidle');
  }

  // Verify cart is empty
  const emptyCart = page.locator('.order-summary-content');
  await expect(emptyCart).toContainText('Your Shopping Cart is empty!');
}

// POSTCONDITION
async function cleanupCart(page) {
  await page.goto(`${testData.navigation.baseUrl}cart`);

  const removeCheckboxes = page.locator('input[name="removefromcart"]');
  const count = await removeCheckboxes.count();

  if (count > 0) {
    for (let i = 0; i < count; i++) {
      await removeCheckboxes.nth(i).check();
    }
    await page.getByRole('button', { name: 'Update shopping cart' }).click();
    await page.waitForLoadState('networkidle');
    console.log('Cart cleared.');
  } else {
    console.log('Cart was already empty.');
  }
}

// POSTCONDITION
async function logout(page) {
  await page.goto(`${testData.navigation.baseUrl}logout`);
  await expect(page).toHaveURL(testData.navigation.baseUrl);
  console.log('User logged out.');
}


test.describe('ECOM_TEST_001 - E-Commerce Workflow with Data Abstraction', () => {

  let email;

  test.beforeEach(async ({ page }) => {
    email = generateEmail();

    console.log('Registering new user');
    console.log(`Email: ${email}`);
    await registerAndLogin(page, email);
    console.log('User registered and logged in.');

    console.log('Ensuring cart is empty...');
    await ensureCartEmpty(page);
    console.log('Cart is empty.');
  });

  test.afterEach(async ({ page }) => {
    console.log('Cleaning up cart...');
    await cleanupCart(page);

    console.log('Logging out...');
    await logout(page);
  });


  test('ECOM_TEST_001 - Registration, Cart Management, and Product Configuration', async ({ page }) => {

    await page.locator('.top-menu').getByRole('link', { name: testData.navigation.category }).hover();

    const dropdown = page.locator('.top-menu li')
      .filter({ hasText: testData.navigation.category })
      .locator('ul.sublist');

    await expect(dropdown.getByRole('link', { name: 'Desktops' })).toBeVisible();
    await expect(dropdown.getByRole('link', { name: 'Notebooks' })).toBeVisible();
    await expect(dropdown.getByRole('link', { name: 'Accessories' })).toBeVisible();

    await dropdown.getByRole('link', { name: testData.navigation.subcategory }).click();
    await expect(page.locator('div.page-title h1')).toHaveText(testData.navigation.subcategory);

    const productItems = page.locator('.product-item');
    await expect(productItems.first()).toBeVisible();

    const expensiveProductsXPath =
      `//div[@class="product-item"][.//span[contains(@class, "actual-price") and number(text()) > ${testData.product.minPrice}]]`;
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

    for (const product of products) {
      console.log(`Found expensive product: ${product.name} — $${product.price}`);
    }

    products.sort((a, b) => b.price - a.price);
    const expensivePc = products.find(p => p.name === testData.product.name);

    expect(expensivePc).toBeDefined();
    expect(expensivePc.price).toBeGreaterThan(testData.product.minPrice);
    console.log(`"${expensivePc.name}" price $${expensivePc.price} > $${testData.product.minPrice}`);

    await page.locator('.product-item .product-title a')
      .filter({ hasText: expensivePc.name })
      .first()
      .click();

    await expect(page.locator('.product-name [itemprop="name"]')).toHaveText(expensivePc.name);

    const basePriceText = await page.locator('.product-price span').first().textContent();
    const basePrice = parseFloat(basePriceText.replace(/[^0-9.]/g, ''));

    const selectedOptions = await page.locator('input[type="radio"]:checked').evaluateAll(nodes =>
      nodes.map(node => {
        const label = node.closest('li')?.textContent || '';
        const priceMatch = label.replace(/\s+/g, ' ').trim().match(/\[([+-]?\d+(?:\.\d+)?)\]/);
        return priceMatch ? parseFloat(priceMatch[1]) : 0;
      })
    );
    const optionsTotal = selectedOptions.reduce((sum, p) => sum + p, 0);
    const actualPrice = basePrice + optionsTotal;
    console.log(`Base price: $${basePrice}, Options: $${optionsTotal}, Unit price: $${actualPrice}`);

    await page.locator('input.add-to-cart-button').click();

    const notification = page.locator('#bar-notification');
    await expect(notification).toBeVisible();
    await expect(notification).toContainText('The product has been added to your shopping cart');
    console.log('Product added to cart notification shown.');

    await page.locator('.ico-cart').first().click();
    await expect(page.locator('div.page-title h1')).toHaveText('Shopping cart');

    const qtyInput = page.locator('input.qty-input').first();
    await expect(qtyInput).toHaveValue(testData.cart.initialQuantity);
    console.log(`Quantity is ${testData.cart.initialQuantity}`);

    await qtyInput.fill(testData.cart.updatedQuantity);
    await expect(qtyInput).toHaveValue(testData.cart.updatedQuantity);

    await page.getByRole('button', { name: 'Update shopping cart' }).click();

    const updatedQty = page.locator('input.qty-input').first();
    await expect(updatedQty).toHaveValue(testData.cart.updatedQuantity);

    const subTotalText = await page.locator('.product-subtotal').first().textContent();
    const subTotal = parseFloat(subTotalText.replace(/[^0-9.]/g, ''));
    const qty = parseInt(testData.cart.updatedQuantity);

    expect(subTotal).toBeCloseTo(actualPrice * qty, 1);
    console.log(`Subtotal $${subTotal} ≈ $${actualPrice} x ${qty} = $${actualPrice * qty}`);

    await page.locator('div.edit-item a').first().click();
    await expect(page.locator('.product-name [itemprop="name"]')).toHaveText(expensivePc.name);
    console.log('Back on product configuration page.');

    const fastLabel = page.locator('label').filter({ hasText: new RegExp(testData.product.processorUpgrade, 'i') });
    const fastRadioId = await fastLabel.getAttribute('for');
    const fastRadio = page.locator(`input#${fastRadioId}`);
    await fastRadio.click();
    await expect(fastRadio).toBeChecked();
    console.log(`"${testData.product.processorUpgrade}" processor option selected.`);

    const newBasePriceText = await page.locator('.product-price span').first().textContent();
    const newBasePrice = parseFloat(newBasePriceText.replace(/[^0-9.]/g, ''));

    const newSelectedOptions = await page.locator('input[type="radio"]:checked').evaluateAll(nodes =>
      nodes.map(node => {
        const label = node.closest('li')?.textContent || '';
        const priceMatch = label.replace(/\s+/g, ' ').trim().match(/\[([+-]?\d+(?:\.\d+)?)\]/);
        return priceMatch ? parseFloat(priceMatch[1]) : 0;
      })
    );
    const newOptionsTotal = newSelectedOptions.reduce((sum, p) => sum + p, 0);
    const newActualPrice = newBasePrice + newOptionsTotal;
    console.log(`New unit price after upgrade: $${newActualPrice}`);

    await page.locator('input.add-to-cart-button').click();

    const notification2 = page.locator('#bar-notification');
    await expect(notification2).toBeVisible();
    await expect(notification2).toContainText('The product has been added to your shopping cart');
    console.log('Product (updated config) added to cart.');

    await page.locator('.ico-cart').first().click();
    await expect(page.locator('div.page-title h1')).toHaveText('Shopping cart');

    const finalSubTotalText = await page.locator('.product-subtotal').first().textContent();
    const finalSubTotal = parseFloat(finalSubTotalText.replace(/[^0-9.]/g, ''));
    const expectedFinalTotal = qty * newActualPrice;

    expect(finalSubTotal).toBeCloseTo(expectedFinalTotal, 1);
    console.log(`Final subtotal $${finalSubTotal} ≈ ${qty} × $${newActualPrice} = $${expectedFinalTotal}`);
  });

});