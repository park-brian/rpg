import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
const distHtmlPath = path.join(rootDir, 'dist', 'index.html');
const distFileUrl = pathToFileURL(distHtmlPath).href;
const screenshotDir = path.join(rootDir, 'artifacts', 'screenshots');

test.describe('Built HTML Rendering & Telemetry Audit', () => {

  test('Render built HTML over HTTP server with full error capturing', async ({ page }) => {
    test.setTimeout(90000);

    const logs = [];
    const errors = [];
    const networkErrors = [];

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      logs.push({ type, text });
      console.log(`[HTTP BROWSER ${type.toUpperCase()}] ${text}`);
      if (type === 'error') {
        errors.push(text);
      }
    });

    page.on('pageerror', err => {
      console.error('[HTTP UNCAUGHT PAGE ERROR]', err.message);
      errors.push(err.message);
    });

    page.on('requestfailed', request => {
      console.error('[HTTP REQUEST FAILED]', request.url(), request.failure()?.errorText);
      networkErrors.push({ url: request.url(), error: request.failure()?.errorText });
    });

    console.log('Navigating to http://127.0.0.1:8080/index.html ...');
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

    // 1. Initial screen check
    await page.waitForTimeout(300);
    const genesis = await page.$('#genesis');
    expect(genesis).not.toBeNull();
    console.log('Genesis screen mounted on HTTP load.');

    // 2. Wait for 40-year preroll to complete and canvas to mount
    await page.waitForSelector('canvas#c', { timeout: 60000 });
    console.log('Canvas successfully mounted on HTTP page!');

    // 3. Telemetry & Invariant check
    const info = await page.evaluate(() => {
      return {
        inspect: window.sim.inspect(),
        invariants: window.sim.checkInvariants(),
        bodyHtml: document.body.innerHTML
      };
    });

    console.log('Simulation metrics on HTTP load:', {
      day: info.inspect.day,
      year: info.inspect.year,
      pop: info.inspect.metrics.pop,
      huts: info.inspect.metrics.huts,
      grain: info.inspect.metrics.grain,
      player: info.inspect.player ? info.inspect.player.name : 'none'
    });

    // 4. Assert zero [object Object] across the entire DOM
    expect(info.bodyHtml).not.toContain('[object Object]');
    expect(info.invariants.ok).toBe(true);
    expect(errors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('Render built HTML directly via file:// URL (Standalone Offline Mode)', async ({ page }) => {
    test.setTimeout(90000);

    const logs = [];
    const errors = [];
    const networkErrors = [];

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      logs.push({ type, text });
      console.log(`[FILE:// BROWSER ${type.toUpperCase()}] ${text}`);
      if (type === 'error') {
        errors.push(text);
      }
    });

    page.on('pageerror', err => {
      console.error('[FILE:// UNCAUGHT PAGE ERROR]', err.message);
      errors.push(err.message);
    });

    page.on('requestfailed', request => {
      console.error('[FILE:// REQUEST FAILED]', request.url(), request.failure()?.errorText);
      networkErrors.push({ url: request.url(), error: request.failure()?.errorText });
    });

    console.log(`Navigating to ${distFileUrl} ...`);
    await page.goto(distFileUrl, { waitUntil: 'domcontentloaded' });

    // Wait for canvas to mount (fallback or worker)
    await page.waitForSelector('canvas#c', { timeout: 60000 });
    console.log('Canvas successfully mounted on file:// standalone load!');

    const domCheck = await page.evaluate(() => {
      return {
        hasCanvas: !!document.querySelector('canvas#c'),
        hasClock: !!document.querySelector('#clock'),
        hasHands: !!document.querySelector('#hands'),
        bodyHtml: document.body.innerHTML,
        simAvailable: !!window.sim
      };
    });

    expect(domCheck.hasCanvas).toBe(true);
    expect(domCheck.hasClock).toBe(true);
    expect(domCheck.hasHands).toBe(true);
    expect(domCheck.simAvailable).toBe(true);
    expect(domCheck.bodyHtml).not.toContain('[object Object]');
    expect(errors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

});
