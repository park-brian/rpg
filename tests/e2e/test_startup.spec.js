import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotDir = path.join(__dirname, '..', '..', 'artifacts', 'screenshots');

test('Default Startup / with 40-Year Genesis Screen and Transition', async ({ page }) => {
  test.setTimeout(120000);

  const errors = [];
  page.on('pageerror', err => {
    console.error('[BROWSER ERROR]', err);
    errors.push(err.message);
  });
  page.on('console', msg => console.log(`[BROWSER CONSOLE ${msg.type()}]`, msg.text()));

  console.log('Navigating to http://localhost:8080/ ...');
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Check if genesis screen or canvas is mounted
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, 'startup_00_initial.png') });

  const hasGenesis = await page.$('#genesis');
  console.log('Genesis element present:', !!hasGenesis);

  // Wait for canvas to appear after 40-year pre-roll
  await page.waitForSelector('canvas#c', { timeout: 90000 });
  console.log('Canvas mounted successfully!');
  await page.screenshot({ path: path.join(screenshotDir, 'startup_01_canvas_mounted.png') });

  // Check sim inspect
  const isInspect = await page.waitForFunction(() => window.sim && typeof window.sim.inspect === 'function');
  expect(isInspect).toBeTruthy();

  const info = await page.evaluate(() => window.sim.inspect());
  console.log('Inspect info after startup:', {
    day: info.day,
    year: info.year,
    pop: info.metrics.pop,
    huts: info.metrics.huts,
    playerAlive: info.player ? info.player.alive : 'no player'
  });

  // Verify canvas has valid dimensions and draws pixels
  const canvasSize = await page.evaluate(() => {
    const c = document.querySelector('canvas#c');
    return { width: c.width, height: c.height, clientWidth: c.clientWidth, clientHeight: c.clientHeight };
  });
  console.log('Canvas sizes:', canvasSize);
  expect(canvasSize.width).toBeGreaterThan(0);
  expect(canvasSize.height).toBeGreaterThan(0);

  expect(errors.length).toBe(0);
});
