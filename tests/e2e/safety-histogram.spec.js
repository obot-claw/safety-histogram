const fs = require('fs');
const { test, expect } = require('@playwright/test');

const FIXTURE_CSV = `TEST,STRESN,USUBJID,STRESU,STNRLO,STNRHI,SITEID,SEX,RACE,ARM,SITE
Albumin,1,SUBJ-001,g/dL,10,20,101,F,WHITE,Placebo,North
Albumin,2,SUBJ-002,g/dL,10,20,101,M,BLACK,Drug,North
Albumin,3,SUBJ-003,g/dL,10,20,102,F,ASIAN,Placebo,South
Albumin,4,SUBJ-004,g/dL,10,20,102,M,WHITE,Drug,South
Albumin,5,SUBJ-005,g/dL,10,20,103,F,BLACK,Placebo,East
Albumin,6,SUBJ-006,g/dL,10,20,103,M,ASIAN,Drug,East
Albumin,7,SUBJ-007,g/dL,10,20,104,F,WHITE,Placebo,West
Albumin,8,SUBJ-008,g/dL,10,20,104,M,BLACK,Drug,West
Albumin,9,SUBJ-009,g/dL,10,20,105,F,ASIAN,Placebo,North
Albumin,10,SUBJ-010,g/dL,10,20,105,M,WHITE,Drug,South
Albumin,11,SUBJ-011,g/dL,10,20,106,F,BLACK,Placebo,East
Albumin,12,SUBJ-012,g/dL,10,20,106,M,ASIAN,Drug,West
Albumin,13,SUBJ-013,g/dL,10,20,107,F,WHITE,Placebo,North
Albumin,14,SUBJ-014,g/dL,10,20,107,M,BLACK,Drug,South
Albumin,15,SUBJ-015,g/dL,10,20,108,F,ASIAN,Placebo,East
Albumin,16,SUBJ-016,g/dL,10,20,108,M,WHITE,Drug,West
Albumin,17,SUBJ-017,g/dL,10,20,109,F,BLACK,Placebo,North
Albumin,18,SUBJ-018,g/dL,10,20,109,M,ASIAN,Drug,South
Albumin,19,SUBJ-019,g/dL,10,20,110,F,WHITE,Placebo,East
Albumin,20,SUBJ-020,g/dL,10,20,110,M,BLACK,Drug,West
Albumin,21,SUBJ-021,g/dL,10,20,111,F,ASIAN,Placebo,North
Albumin,22,SUBJ-022,g/dL,10,20,111,M,WHITE,Drug,South
Albumin,23,SUBJ-023,g/dL,10,20,112,F,BLACK,Placebo,East
Albumin,24,SUBJ-024,g/dL,10,20,112,M,ASIAN,Drug,West
Albumin,25,SUBJ-025,g/dL,10,20,113,F,WHITE,Placebo,North
Albumin,26,SUBJ-026,g/dL,10,20,113,M,BLACK,Drug,South
Albumin,27,SUBJ-027,g/dL,10,20,114,F,ASIAN,Placebo,East
Albumin,28,SUBJ-028,g/dL,10,20,114,M,WHITE,Drug,West
Albumin,29,SUBJ-029,g/dL,10,20,115,F,BLACK,Placebo,North
Albumin,30,SUBJ-030,g/dL,10,20,115,M,ASIAN,Drug,South
Bilirubin,1.1,SUBJ-031,mg/dL,0.2,1.2,116,F,WHITE,Placebo,East
Bilirubin,1.8,SUBJ-032,mg/dL,0.2,1.2,116,M,BLACK,Drug,West`;

async function setHarnessSettings(page, settings = {}) {
  await page.evaluate(overrides => {
    window.__safetyHistogramInstance.setSettings({
      page_size: 5,
      group_by: 'sh_none',
      compare_distributions: false,
      test_normality: true,
      display_normal_range: true,
      annotate_bin_boundaries: true,
      ...overrides
    });
  }, settings);
}

async function showFullListing(page) {
  await page.evaluate(() => {
    const instance = window.__safetyHistogramInstance;
    const rows = instance.currentFilteredData();
    instance.showListing(rows, { records: rows, lower: 1, upper: 30 }, 0);
  });
  await expect(page.locator('.sh-listing table')).toBeVisible();
}

async function selectFirstPopulatedCanvasBar(page) {
  await page.evaluate(() => {
    const instance = window.__safetyHistogramInstance;
    const chart = instance.chart;
    const index = chart.$shBins.findIndex(bin => bin.records.length > 0);
    chart.options.onClick({}, [{ index }]);
  });
  await expect(page.locator('.sh-listing table')).toBeVisible();
}

test.describe('Safety Histogram nextgen demo', () => {
  test.beforeEach(async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page._shErrors = errors;
    await page.route('**/adbds.csv', route => route.fulfill({ contentType: 'text/csv', body: FIXTURE_CSV }));
    await page.goto('/test-page/');
    await page.waitForFunction(() => window.__safetyHistogramInstance && window.__safetyHistogramInstance.chart);
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
      'Group charts by',
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
    await page.locator('.sh-controls .sh-control', { hasText: 'Sex' }).locator('select').selectOption({ index: 1 });
    const after = await page.locator('.sh-notes').innerText();
    expect(after).not.toBe(before);
  });

  test('selecting a Chart.js canvas bar opens a linked listing', async ({ page }) => {
    await setHarnessSettings(page);
    await selectFirstPopulatedCanvasBar(page);
    await expect(page.locator('.sh-listing-actions')).toContainText('records');
    await expect(page.locator('.sh-listing-actions')).toContainText('Export: CSV');
    await expect(page.locator('.sh-footnote')).toContainText('Selected:');
  });

  test('listing supports pagination, search, sorting, and CSV export', async ({ page }) => {
    await setHarnessSettings(page);
    await showFullListing(page);

    await expect(page.locator('.sh-listing tbody tr')).toHaveCount(5);
    await page.getByRole('button', { name: '>', exact: true }).click();
    await expect(page.locator('.sh-listing tbody')).toContainText('SUBJ-006');
    await page.getByRole('button', { name: '>>' }).click();
    await expect(page.locator('.sh-listing tbody')).toContainText('SUBJ-026');
    await page.getByRole('button', { name: '<', exact: true }).click();
    await expect(page.locator('.sh-listing tbody')).toContainText('SUBJ-021');
    await page.getByRole('button', { name: '<<' }).click();
    await expect(page.locator('.sh-listing tbody')).toContainText('SUBJ-001');

    await page.locator('.sh-listing-search').fill('SUBJ-012');
    await expect(page.locator('.sh-listing tbody tr')).toHaveCount(1);
    await expect(page.locator('.sh-listing tbody')).toContainText('SUBJ-012');

    await page.locator('.sh-listing-search').fill('');
    await page.locator('.sh-listing th', { hasText: 'Result' }).click();
    await expect(page.locator('.sh-listing th', { hasText: 'Result ▲' })).toBeVisible();
    await expect(page.locator('.sh-listing tbody tr').first()).toContainText('SUBJ-001');
    await page.locator('.sh-listing th', { hasText: /Result/ }).click();
    await expect(page.locator('.sh-listing th', { hasText: 'Result ▼' })).toBeVisible();
    await expect(page.locator('.sh-listing tbody tr').first()).toContainText('SUBJ-030');

    const download = page.waitForEvent('download');
    await page.locator('.sh-listing-actions button', { hasText: 'Export: CSV' }).click();
    const csvDownload = await download;
    expect(csvDownload.suggestedFilename()).toBe('safety-histogram-listing.csv');
    const csv = fs.readFileSync(await csvDownload.path(), 'utf8');
    expect(csv.split('\n')[0]).toBe('Participant ID,Site ID,Sex,Race,Treatment Group,Participant ID,Result,Lower Limit of Normal,Upper Limit of Normal,Unit');
    expect(csv).toContain('SUBJ-030');
  });

  test('normal range control exposes a stable Chart.js overlay region', async ({ page }) => {
    await page.evaluate(() => {
      const instance = window.__safetyHistogramInstance;
      instance.state.displayNormalRange = true;
      instance.render();
    });
    await page.waitForFunction(() => window.__safetyHistogramInstance.chart.$shNormalRangeOverlay);
    const overlay = await page.evaluate(() => window.__safetyHistogramInstance.chart.$shNormalRangeOverlay);
    expect(overlay.low).toBe(10);
    expect(overlay.high).toBe(20);
    expect(overlay.width).toBeGreaterThan(0);
    expect(overlay.left).toBeGreaterThanOrEqual(0);
    expect(overlay.right).toBeGreaterThan(overlay.left);

    await page.evaluate(() => {
      const instance = window.__safetyHistogramInstance;
      instance.state.displayNormalRange = false;
      instance.render();
    });
    await page.waitForFunction(() => window.__safetyHistogramInstance.chart.$shNormalRangeOverlay === null);
    expect(await page.evaluate(() => window.__safetyHistogramInstance.chart.$shNormalRangeOverlay)).toBeNull();
  });

  test('x-axis lower and upper controls redraw and normalize invalid ranges', async ({ page }) => {
    await setHarnessSettings(page);
    await page.locator('.sh-control', { hasText: 'Lower' }).locator('input').fill('25');
    await page.locator('.sh-control', { hasText: 'Lower' }).locator('input').dispatchEvent('change');
    await page.locator('.sh-control', { hasText: 'Upper' }).locator('input').fill('5');
    await page.locator('.sh-control', { hasText: 'Upper' }).locator('input').dispatchEvent('change');
    const domain = await page.evaluate(() => [
      window.__safetyHistogramInstance.state.lower,
      window.__safetyHistogramInstance.state.upper,
      window.__safetyHistogramInstance.chart.$shBins[0].lower,
      window.__safetyHistogramInstance.chart.$shBins.at(-1).upper
    ]);
    expect(domain).toEqual([5, 25, 5, 25]);
  });

  test('x-axis tick mode switches labels between centers and bin boundaries', async ({ page }) => {
    await page.evaluate(() => {
      const instance = window.__safetyHistogramInstance;
      instance.state.annotateBoundaries = false;
      instance.render();
    });
    const midpointLabels = await page.evaluate(() => window.__safetyHistogramInstance.chart.data.labels);
    expect(midpointLabels.some(label => label.includes('–'))).toBe(false);

    await page.locator('.sh-control', { hasText: 'X-axis Ticks' }).locator('select').selectOption('boundaries');
    const boundaryLabels = await page.evaluate(() => window.__safetyHistogramInstance.chart.data.labels);
    expect(boundaryLabels.some(label => label.includes('–'))).toBe(true);
  });

  test('p-value annotations display the approximation and validation disclaimer', async ({ page }) => {
    await setHarnessSettings(page, { group_by: 'ARM', compare_distributions: true });
    await expect(page.locator('.sh-main-annotation')).toContainText(/Normality: p=/);
    await expect(page.locator('.sh-main-annotation .sh-info')).toHaveAttribute('title', /not validated/);
    await expect(page.locator('.sh-multiple .sh-annotation').first()).toContainText(/Group comparison: p=/);
    await expect(page.locator('.sh-multiple .sh-info').first()).toHaveAttribute('title', /not validated/);
  });

  test('group-by renders grouped histograms', async ({ page }) => {
    await page.locator('.sh-control', { hasText: 'Group charts by' }).locator('select').selectOption('SEX');
    await expect(page.locator('.sh-multiple').first()).toBeVisible();
  });

  test('clean lifecycle API supports settings, data, resize, render, and destroy', async ({ page }) => {
    const result = await page.evaluate(() => {
      const instance = window.__safetyHistogramInstance;
      const methods = ['init', 'setData', 'setSettings', 'render', 'resize', 'destroy'];
      const hasMethods = methods.every(method => typeof instance[method] === 'function');
      const setSettingsReturnsInstance = instance.setSettings({ page_size: 4, group_by: 'sh_none' }) === instance;
      const setDataReturnsInstance = instance.setData(instance.rawData.slice(0, 12)) === instance;
      const renderReturns = instance.render();
      instance.resize();
      const chartCountBeforeDestroy = instance.charts.length;
      instance.destroy();
      return {
        hasMethods,
        setSettingsReturnsInstance,
        setDataReturnsInstance,
        renderReturns,
        chartCountBeforeDestroy,
        containerText: document.querySelector('#container').textContent.trim()
      };
    });
    expect(result.hasMethods).toBe(true);
    expect(result.setSettingsReturnsInstance).toBe(true);
    expect(result.setDataReturnsInstance).toBe(true);
    expect(result.renderReturns).toBeUndefined();
    expect(result.chartCountBeforeDestroy).toBeGreaterThan(0);
    expect(result.containerText).toBe('');
  });
});
