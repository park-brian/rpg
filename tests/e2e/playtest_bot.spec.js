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

test.describe('Autonomous E2E Playtesting Bot Scenario', () => {

  test('Single-Player Autonomous Playtest: Perception, Survival, Affordances & Invariants', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Launch into live interactive game
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas#c');
    await page.waitForFunction(() => window.sim && typeof window.sim.inspect === 'function');

    // 2. Observe initial state via window.sim.inspect()
    let info = await page.evaluate(() => window.sim.inspect());
    expect(info.player.alive).toBe(1);
    expect(info.player.name).toBe('You');
    console.log(`[Playtest] Spawned at (${info.player.x}, ${info.player.y}) with ${info.player.held.length} items`);

    await captureScreenshot(page, 'playtest_01_spawn');

    // 3. Survival Action: Equip and eat bread
    // Select bread slot (slot index 3 in hands)
    await page.keyboard.press('Digit4');
    await page.waitForTimeout(150);

    // Trigger action (Space / E) to consume bread
    await page.keyboard.press('Space');
    await page.waitForTimeout(400);

    info = await page.evaluate(() => window.sim.inspect());
    console.log(`[Playtest] Consumed bread. Hunger: ${info.player.needs[0].toFixed(1)}`);
    await captureScreenshot(page, 'playtest_02_eat_bread');

    // 4. Resource Gathering: Equip knife and harvest thatch
    await page.keyboard.press('Digit1'); // Knife
    await page.waitForTimeout(150);

    // Face South / Grass and gather thatch
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    info = await page.evaluate(() => window.sim.inspect());
    console.log(`[Playtest] Gathered thatch. Held items:`, info.player.held);
    await captureScreenshot(page, 'playtest_03_gather_thatch');

    // 5. Exploration: Traverse East along the road towards the settlement
    for (let step = 0; step < 8; step++) {
      await page.keyboard.press('KeyD');
      await page.waitForTimeout(80);
    }

    info = await page.evaluate(() => window.sim.inspect());
    console.log(`[Playtest] Traversed East. Current position: (${info.player.x}, ${info.player.y})`);
    await captureScreenshot(page, 'playtest_04_travel_east');

    // 6. Inspect Action Affordances Panel
    await page.keyboard.press('KeyR');
    const panel = page.locator('#panel');
    await expect(panel).toHaveClass(/on/);
    await captureScreenshot(page, 'playtest_05_affordance_menu');
    await page.keyboard.press('KeyQ');
    await expect(panel).not.toHaveClass(/on/);

    // 7. Verify Simulation Invariant Consistency
    const invariants = await page.evaluate(() => window.sim.checkInvariants());
    expect(invariants.ok).toBe(true);
    expect(invariants.stockMismatches).toBe(0);
    expect(invariants.deadActions).toBe(0);
    console.log('✔ All Playtest Simulation Invariants Verified Successfully!');
  });

});
