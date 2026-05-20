const { test, expect } = require('@playwright/test');

test.describe('Safety Histogram nextgen demo', () => {
  test.beforeEach(async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page._shErrors = errors;
    await page.goto('/test-page/');
    await page.waitForSelector('canvas.sh-chart');
  });

  test.afterEach(async ({ page }) => {
    expect(page._shErrors).toEqual([]);
  });

  test('renders controls required by the functional spec', async ({ page }) => {
    const labels = await page.locator('.sh-control label').allTextContents();
    await expect(labels).toEqual(expect.arrayContaining([
      'Measure',
      'Site ID',
      'Sex',
      'Race',
      'Treatment Group',
      'Participant ID',
      'Group by',
      'Lower',
      'Upper',
      'Algorithm',
      'Quantity',
      'Width',
      'Normal Range',
      'X-axis Ticks'
    ]));
  });

  test('updates participant note when a filter is applied', async ({ page }) => {
    const before = await page.locator('.sh-notes').innerText();
    await page.locator('.sh-control', { hasText: 'Sex' }).locator('select').selectOption({ index: 1 });
    const after = await page.locator('.sh-notes').innerText();
    expect(after).not.toBe(before);
  });

  test('clicking a bar opens a linked listing with pagination and export', async ({ page }) => {
    const box = await page.locator('canvas.sh-chart').boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.locator('.sh-listing table')).toBeVisible();
    await expect(page.locator('.sh-listing-actions')).toContainText('records');
    await expect(page.locator('.sh-listing-actions')).toContainText('Export: CSV');
  });

  test('group-by renders grouped histograms', async ({ page }) => {
    await page.locator('.sh-control', { hasText: 'Group by' }).locator('select').selectOption('SEX');
    await expect(page.locator('.sh-multiple').first()).toBeVisible();
  });
});
