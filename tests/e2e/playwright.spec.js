// @ts-check
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotDir = path.join(__dirname, '..', '..', 'artifacts', 'screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function captureScreenshot(page, name) {
  await page.screenshot({ path: path.join(screenshotDir, `${name}.png`) });
}

test.describe('Ford Simulation & Game E2E Browser Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Inject _screenshot into page/worker context for in-browser visual verification
    await page.exposeFunction('_screenshot', async (name) => {
      await captureScreenshot(page, name);
    });
  });

  test('Index page loads with canvas and control pads', async ({ page }) => {
    await page.goto('/');

    // Verify main container and canvas render
    const canvas = page.locator('canvas#c');
    await expect(canvas).toBeVisible();

    // Verify UI overlay elements exist
    await expect(page.locator('#clock')).toBeVisible();
    await expect(page.locator('#hands')).toBeVisible();
    await expect(page.locator('#menubtn')).toBeVisible();
    await expect(page.locator('#hint')).toBeAttached();

    // Capture visual appearance
    await captureScreenshot(page, 'screenshot_gameplay');
  });

  test('Interactive D-Pad and Keyboard navigation & Affordance Panel', async ({ page }) => {
    await page.goto('/');

    // Press D to step East
    await page.keyboard.press('KeyD');
    await page.waitForTimeout(100);

    // Press E / Space for primary action
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(100);

    // Open act panel with R
    await page.keyboard.press('KeyR');
    const panel = page.locator('#panel');
    await expect(panel).toHaveClass(/on/);

    // Verify and capture action affordance panel visual
    await captureScreenshot(page, 'screenshot_acts_panel');

    // Close panel with Q
    await page.keyboard.press('KeyQ');
    await expect(panel).not.toHaveClass(/on/);
  });

  test('Menu panel views: Me, Journal, and Speed controls', async ({ page }) => {
    await page.goto('/');

    // Click menu button
    await page.click('#menubtn');
    const panel = page.locator('#panel');
    await expect(panel).toHaveClass(/on/);

    // Capture menu panel visual
    await captureScreenshot(page, 'screenshot_menu');

    // Click 'Me' view to inspect needs
    const meRow = page.locator('#panel .row', { hasText: 'Me' });
    await meRow.click();
    await expect(page.locator('#panel .bar')).toHaveCount(5); // 5 needs bars

    // Capture character stats inspection visual
    await captureScreenshot(page, 'screenshot_character_stats');

    // Close menu
    await page.keyboard.press('Escape');
    await expect(panel).not.toHaveClass(/on/);
  });

  test('Hash navigation: #sim dashboard and #test automated gates', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Test runner page (#test)
    await page.goto('/#test', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#test .g', { timeout: 60000 });
    const passElements = page.locator('#test .g.pass');
    expect(await passElements.count()).toBeGreaterThanOrEqual(25);
    await captureScreenshot(page, 'screenshot_test_runner');

    // 2. Headless dashboard page (#sim)
    await page.goto('/#sim?years=2', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#stat', { timeout: 30000 });
    await page.waitForTimeout(1500); // let simulation tick and draw chart
    const statText = await page.textContent('#stat');
    expect(statText).toContain('year');
    expect(statText).toContain('pop');
    await captureScreenshot(page, 'screenshot_sim_dashboard');
  });

  test('Procedural Macro Worldgen (#gen) visual inspection', async ({ page }) => {
    await page.goto('/#gen', { waitUntil: 'domcontentloaded' });
    const canvas = page.locator('#genc');
    await expect(canvas).toBeVisible();
    const info = page.locator('#geninfo');
    await expect(info).toContainText('World generated');
    await captureScreenshot(page, 'screenshot_worldgen');
  });

});
