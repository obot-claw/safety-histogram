const { test, expect } = require('@playwright/test');

test.describe('reviewed safety-histogram browser requirements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-page/requirements/index.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.bar-group .bar').first()).toBeVisible({ timeout: 10_000 });
  });

  test('SH-FUNC-004B hides normal range by default and shows it when enabled', async ({ page }) => {
    await expect(page.locator('g.normal-ranges')).toHaveCount(0);

    const normalRangeControl = page.locator('#normal-range input[type="checkbox"]');
    await expect(normalRangeControl).toHaveCount(1);
    await normalRangeControl.check();
    await page.waitForFunction(() => window.__sh.config.display_normal_range === true);

    await expect(page.locator('g.normal-ranges rect.normal-range__rect')).not.toHaveCount(0);
  });

  test('SH-FUNC-010/011/012 clicking a bar opens contextual listing and highlights selection', async ({ page }) => {
    const firstBarGroup = page.locator('.bar-group').first();
    await expect(firstBarGroup.locator('.bar')).toBeVisible();
    await firstBarGroup.click();

    await expect(page.locator('.sh-listing')).toBeVisible();
    await expect(page.locator('.sh-listing table')).toBeVisible();
    await expect(page.locator('.sh-listing')).toContainText('Participant ID');
    await expect(page.locator('.sh-listing')).toContainText('Result');
    await expect(page.locator('.sh-listing')).toContainText('Lower Limit of Normal');
    await expect(page.locator('.sh-listing')).toContainText('Upper Limit of Normal');
    await expect(page.locator('.sh-foot-note--bar-details')).toContainText('Table displays');

    const opacities = await page.locator('.bar-group .bar').evaluateAll(bars =>
      bars.map(bar => bar.getAttribute('fill-opacity'))
    );
    expect(opacities).toContain('1');
    expect(opacities).toContain('0.5');
  });
});
