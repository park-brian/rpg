import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../../build.js';
import {
  makeWorld, step, inject, read, hash, DATA, T
} from '../../src/sim.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Build Verification: index.html is generated correctly and contains scripts', () => {
  build();
  const indexPath = path.join(__dirname, '..', '..', 'index.html');
  assert.ok(fs.existsSync(indexPath), 'index.html must exist');

  const content = fs.readFileSync(indexPath, 'utf8');
  assert.ok(content.includes('<canvas id="c"></canvas>'), 'Canvas element present');
  assert.ok(content.includes('<script>'), 'Embedded script tag present');
  assert.ok(content.includes('function createSim'), 'Simulation code embedded in HTML');
  assert.ok(!content.includes('<!-- GAME_SCRIPT -->'), 'Placeholder replaced');
});

test('E2E Multi-View Contract: read() returns valid structures across all view modes', () => {
  const { S, player, home } = makeWorld(15);

  // 1. 'hot' view
  const hot = read(S, 'hot');
  assert.ok(hot.n > 0);
  assert.ok(hot.x instanceof Int16Array);
  assert.ok(hot.y instanceof Int16Array);
  assert.ok(hot.alive instanceof Uint8Array);

  // 2. 'metrics' view
  const metrics = read(S, 'metrics');
  assert.ok(metrics.pop > 0);
  assert.ok(metrics.households >= 1);
  assert.ok(Array.isArray(metrics.hours));

  // 3. {person: id} view
  const pView = read(S, { person: player });
  assert.strictEqual(pView.name, 'You');
  assert.ok(pView.alive);
  assert.ok(Array.isArray(pView.needs) && pView.needs.length === 5);
  assert.ok(Array.isArray(pView.hands));

  // 4. {acts: id} view
  const acts = read(S, { acts: player });
  assert.ok(Array.isArray(acts));
  assert.ok(acts.length > 0);
  assert.ok(acts.some(a => a.act === 'inspect'));

  // 5. {site: id} view
  const siteItems = read(S, { site: home });
  assert.ok(Array.isArray(siteItems));
  assert.ok(siteItems.some(item => item.name === 'grain'));

  // 6. {inspect: tile, person: id} view
  const inspectTile = read(S, { inspect: home, person: player });
  assert.ok(inspectTile.title);
  assert.ok(Array.isArray(inspectTile.lines));
});

test('E2E Settlement Flow: 2-Year Headless Simulation builds hut and produces crops', () => {
  const { S } = makeWorld(11, false);
  const YEAR = DATA.DAYS_PER_YEAR * 1440;

  step(S, S.time + 2 * YEAR);

  const finalMetrics = read(S, 'metrics');
  assert.ok(finalMetrics.pop > 0, 'Village must remain alive after 2 years');
  assert.ok(finalMetrics.huts > 0, 'A hut must be constructed');
  assert.ok(finalMetrics.fields > 0, 'Fields must be tilled and harvested');
});
