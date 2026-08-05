import { test, expect } from '@playwright/test';

test.describe('E2E Restaurant Workflow', () => {
  const CUSTOMER_URL = 'http://localhost:3001';
  const ADMIN_URL = 'http://localhost:3002';
  const CHIEF_URL = 'http://localhost:3003';
  
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'Password123!';

  // Use a longer timeout for E2E flows
  test.setTimeout(120000);

  test('Full Flow: Frontend Applications Health & Routing', async ({ browser }) => {
    // We create separate contexts for Customer, Chief, and Admin
    const customerContext = await browser.newContext();
    const chiefContext = await browser.newContext();
    const adminContext = await browser.newContext();

    const customerPage = await customerContext.newPage();
    const chiefPage = await chiefContext.newPage();
    const adminPage = await adminContext.newPage();

    console.log('1. [Customer] Registration & Login');
    await customerPage.goto(CUSTOMER_URL);
    await customerPage.click('text=Sign In');
    await customerPage.click('text=Register');
    await customerPage.fill('input[placeholder="Your name"]', 'E2E Test User');
    await customerPage.fill('input[type="email"]', email);
    await customerPage.fill('input[type="tel"]', '1234567890');
    await customerPage.fill('input[type="password"]', password);
    await customerPage.click('button:has-text("Create Account")');
    await customerPage.waitForURL(CUSTOMER_URL + '/menu');

    console.log('2. [Customer] Verify Menu Loads');
    await expect(customerPage.locator('text=Menu')).toBeVisible();
    
    console.log('3. [Admin] Login & Dashboard');
    await adminPage.goto(ADMIN_URL);
    await adminPage.fill('input[type="email"]', 'admin@restaurant.com');
    await adminPage.fill('input[type="password"]', 'dev-password-123');
    await adminPage.click('button:has-text("Sign in")');
    await adminPage.waitForURL(`${ADMIN_URL}/`);
    await expect(adminPage.locator('text=Dashboard')).toBeVisible();

    console.log('4. [Admin] Verify Analytics');
    await adminPage.goto(`${ADMIN_URL}/analytics`);
    await expect(adminPage.locator('text=Download CSV Report')).toBeVisible();

    console.log('5. [Chief] Login & KDS Verification');
    await chiefPage.goto(CHIEF_URL);
    await chiefPage.fill('input[type="email"]', 'chief@restaurant.com');
    await chiefPage.fill('input[type="password"]', 'dev-password-123');
    await chiefPage.click('button:has-text("Sign in")');
    await chiefPage.waitForURL(`${CHIEF_URL}/`);
    await expect(chiefPage.locator('text=Kitchen Display System')).toBeVisible();
    
    // Close contexts
    await customerContext.close();
    await chiefContext.close();
    await adminContext.close();
    
    console.log('--- E2E Test Completed Successfully ---');
  });
});
