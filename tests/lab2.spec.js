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
        const price = parseFloat(priceText);

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

test('LAB2_TEST_002', async ({ page }) => {
    await page.goto("https://demoqa.com/");

    await page.getByText('Elements').click();

    await page.getByText('Web Tables').click();

    const nextButton = page.getByText('Next');
    // 100 is random here
    for (let i = 0; i < 100; i++) {
        await page.locator('button#addNewRecordButton').filter({hasText: 'Add'}).click();        const firstName = `First${i}`;
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
    await expect(page.locator('.col-auto').filter({hasText: 'Page'})).toContainText('Page 1 of 2');
    await nextButton.click();

    await page.locator('table tbody tr').first()
     .locator('span[title="Delete"]').click();

        await expect(page.locator('.col-auto').filter({hasText: 'Page'})).toContainText('Page 1 of 1');

});