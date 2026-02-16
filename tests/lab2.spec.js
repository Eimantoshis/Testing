import { test, expect } from '@playwright/test';

test('LAB2_TEST_001', async ({ page }) => {
    await page.goto("https://demowebshop.tricentis.com/")

    // 1) verify
    await expect(page).toHaveTitle(/Demo Web Shop/);

    await page.locator('ul.top-menu')
        .getByRole('link', { name: 'Books' })
        .click();
    
    const products = await page.locator('div.item-box').all();
    // 2) verify
    expect(products.length).toBeGreaterThan(3);
    const affordableBooks = [];
    for (const product of products) {
        const priceText = await product.locator('span.price.actual-price').textContent();
        const price = parseFloat(priceText);2

        if (price < 20) {
            affordableBooks.push(product);
        }
    }
    // 3) verify
    expect(affordableBooks.length).toBeGreaterThan(2);

    const addedBooks = []
    for (const book of affordableBooks) {
        const addToCartButton = book.locator('input[value="Add to cart"]');
        // not all books have "Add to cart" button
        if (await addToCartButton.count() > 0) {
            await addToCartButton.click();
                // 4) verify
                await expect(page.locator('p.content')).toHaveText('The product has been added to your shopping cart');
                addedBooks.push(book);
        }
    }

    let totalPrice = 0;
    for (const book of addedBooks) {
        const priceText = await book.locator('span.price.actual-price').textContent();
        const price = parseFloat(priceText);
        totalPrice += price;
    }
    await page.locator('li#topcartlink a.ico-cart').click();

    const cartPriceText = await page.locator('td.cart-total-right span.product-price').first().textContent();
    const cartPrice = parseFloat(cartPriceText);

    // 5) verify
    expect(cartPrice).toBe(totalPrice);
    


});