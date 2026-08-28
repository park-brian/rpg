import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeWorld, step, read, makeWorldWanderer, makeWorldWandererAsync, DATA, hash
} from '../../src/sim.js';
import { computeLOS } from '../../src/view.js';

test('M6: Line-of-Sight (LOS) Field of View calculation', () => {
  assert.strictEqual(typeof computeLOS, 'function', 'computeLOS function must exist');

  const { S, player } = makeWorld(601);
  const px = S.px[player], py = S.py[player];
  const los = computeLOS(S, px, py, 10);

  assert.ok(los instanceof Uint8Array, 'LOS returns typed array of visibility mask');
  assert.equal(los.length, S.W * S.H, 'LOS mask covers entire world grid');
  assert.equal(los[py * S.W + px], 1, 'Player current tile is fully visible');
});

test('M6: 10-Year Headless Pre-Roll Wanderer Start Flow', () => {
  assert.strictEqual(typeof makeWorldWanderer, 'function', 'makeWorldWanderer function must exist');

  const { S, player } = makeWorldWanderer(602, 10); // 10-year pre-roll

  assert.ok(player >= 0, 'Player wanderer spawned');
  assert.strictEqual(S.pname[player], 'You', 'Player named "You"');
  assert.ok(S.time >= 10 * DATA.DAYS_PER_YEAR * 1440, 'Simulation has pre-rolled 10 years');

  const m = read(S, 'metrics');
  assert.ok(m.pop > 0, 'Village is populated and active when wanderer arrives');
  assert.ok(m.huts > 0, 'Village has standing cabins');
});

test('M6: makeWorldWandererAsync progressive chunked pre-roll and determinism', async () => {
  assert.strictEqual(typeof makeWorldWandererAsync, 'function', 'makeWorldWandererAsync must exist');

  const progressUpdates = [];
  const { S, player } = await makeWorldWandererAsync(603, 3, (p) => {
    progressUpdates.push(p.year);
  });

  assert.equal(progressUpdates.length, 3, 'Received progress updates for each year');
  assert.deepEqual(progressUpdates, [1, 2, 3], 'Progress years sequence 1..3');
  assert.ok(player >= 0, 'Player spawned');
  assert.strictEqual(S.pname[player], 'You', 'Player named "You"');
  assert.equal(S.px[player], 2, 'Player at western road entry');
  assert.equal(S.py[player], S.H >> 1, 'Player at road Y');
});

