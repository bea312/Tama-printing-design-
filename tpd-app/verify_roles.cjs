const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  const base = 'http://localhost:5197';

  // ---- Admin: signup, see everything including Team, add an employee ----
  const adminPage = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  adminPage.on('pageerror', (e) => errors.push('admin pageerror: ' + e.message));
  adminPage.on('console', (m) => { if (m.type() === 'error') errors.push('admin: ' + m.text()); });

  await adminPage.goto(base + '/login', { waitUntil: 'networkidle' });
  await adminPage.fill('input[type="email"]', 'roleadmin@example.com');
  await adminPage.fill('input[type="password"]', 'testpass');
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForURL(base + '/', { timeout: 10000 });
  await adminPage.waitForSelector('text=Dashboard');

  const navLinks = await adminPage.locator('nav a, aside nav a').allTextContents();
  console.log('Admin sidebar nav items:', JSON.stringify(navLinks.map(s => s.trim()).filter(Boolean)));

  // Add a product so the employee has something real to sell
  await adminPage.click('a[href="/products"]');
  await adminPage.waitForURL('**/products');
  await adminPage.click('button:has-text("Add Product")');
  await adminPage.waitForSelector('.modal-box');
  await adminPage.fill('input[placeholder^="e.g. A4"]', 'Shared Product');
  await adminPage.fill('input[placeholder="2500"]', '1000');
  await adminPage.fill('input[placeholder="3500"]', '2000');
  await adminPage.fill('input[placeholder="0"]', '25');
  await adminPage.click('.modal-footer button.btn-primary:has-text("Add Product")');
  await adminPage.waitForTimeout(500);

  // Go to Team, add an employee
  await adminPage.click('a[href="/team"]');
  await adminPage.waitForURL('**/team');
  await adminPage.waitForSelector('text=Team');
  await adminPage.click('button:has-text("Add Employee")');
  await adminPage.waitForSelector('.modal-box');
  await adminPage.fill('input[placeholder^="e.g. Jean"]', 'Employee One');
  await adminPage.fill('input[placeholder="employee@example.com"]', 'employee1@example.com');
  await adminPage.fill('input[placeholder="••••••••"]', 'emppass1');
  await adminPage.click('.modal-footer button.btn-primary:has-text("Add Employee")');
  await adminPage.waitForTimeout(500);
  await adminPage.screenshot({ path: 'C:/Users/SOOQEL~1/AppData/Local/Temp/claude/roles_admin_team.png', fullPage: true });
  console.log('Admin: Team page + employee added OK');

  // ---- Employee: log in, should only see Stock Out + Expenses, and same product ----
  const empPage = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  empPage.on('pageerror', (e) => errors.push('employee pageerror: ' + e.message));
  empPage.on('console', (m) => { if (m.type() === 'error') errors.push('employee: ' + m.text()); });

  await empPage.goto(base + '/login', { waitUntil: 'networkidle' });
  await empPage.fill('input[type="email"]', 'employee1@example.com');
  await empPage.fill('input[type="password"]', 'emppass1');
  await empPage.click('button[type="submit"]');
  await empPage.waitForURL(base + '/stock-out', { timeout: 10000 });
  console.log('Employee redirected to:', empPage.url());

  const empNavLinks = await empPage.locator('nav a, aside nav a').allTextContents();
  console.log('Employee sidebar nav items:', JSON.stringify(empNavLinks.map(s => s.trim()).filter(Boolean)));

  // Try to force-navigate to a restricted page directly by URL
  await empPage.goto(base + '/products', { waitUntil: 'networkidle' });
  console.log('Employee visiting /products redirected to:', empPage.url());

  await empPage.goto(base + '/team', { waitUntil: 'networkidle' });
  console.log('Employee visiting /team redirected to:', empPage.url());

  // Confirm employee sees the admin's real product in Stock Out
  await empPage.goto(base + '/stock-out', { waitUntil: 'networkidle' });
  await empPage.click('button:has-text("Record Sale")');
  await empPage.waitForSelector('.modal-box');
  const productOptions = await empPage.locator('.modal-box select option').allTextContents();
  console.log('Employee product options in Record Sale:', JSON.stringify(productOptions));
  await empPage.screenshot({ path: 'C:/Users/SOOQEL~1/AppData/Local/Temp/claude/roles_employee_stockout.png', fullPage: true });

  console.log('CONSOLE_ERRORS:', JSON.stringify(errors));
  await browser.close();
})().catch((e) => { console.error('SCRIPT_FAILED:', e.message); process.exit(1); });
