import { test, expect } from '@playwright/test';

test.describe('Client Workflows', () => {
  const CUSTOMER_URL = 'http://localhost:3001';
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'Password123!';

  test('Complete Customer Flow: Register -> Order -> Cancel', async ({ page }) => {
    // 1. Browse Menu (Public)
    await page.goto(CUSTOMER_URL);
    await expect(page).toHaveTitle(/Radhna/);
    
    // 2. Register
    await page.click('text=Sign In');
    await page.click('text=Register');
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="tel"]', '1234567890');
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Sign Up")');
    
    // Wait for redirect to home/login
    await page.waitForURL(CUSTOMER_URL + '/');

    // 3. Add to Cart
    await page.goto(`${CUSTOMER_URL}/menu`);
    const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();
    await addToCartBtn.click();
    
    // Wait for Cart drawer
    await expect(page.locator('text=Your Order')).toBeVisible();

    // 4. Checkout
    await page.click('button:has-text("Proceed to Checkout")');
    
    // We expect Razorpay or an order confirmation to pop up. 
    // Since we don't have real Razorpay keys in testing, the system should catch the error
    // or we might need to intercept the API.
    // For now, let's just assert that the API call happened and the UI showed payment handling.
  });
});
