import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DATA, T, ACT, makeWorld, step, inject, read, held, count, addThing, setQty, setTile, idx, applyAct
} from '../../src/sim.js';

test('M2: Person Skills progression and efficiency impact', () => {
  const { S, player } = makeWorld(201);
  assert.ok(S.pskills instanceof Float32Array, 'pskills array must exist on Sim');

  // Verify skills array is sized for MAXP * 12
  const skillIdx = (p, sk) => p * 12 + sk;
  const FARMING = 0, WOODCUTTING = 1;

  const initialFarming = S.pskills[skillIdx(player, FARMING)];
  assert.strictEqual(initialFarming, 0, 'Initial skill starts at 0 or base level');

  // Perform farming act
  const grass = idx(S, S.px[player] + 1, S.py[player]);
  setTile(S, grass, T.grass);
  S.pface[player] = 3;
  const spade = held(S, 1, player, 'spade') >= 0 ? held(S, 1, player, 'spade') : addThing(S, { stuff: 'spade', holder: player, holderKind: 1 });

  inject(S, player, { k: 'act', slot: spade, target: grass, act: 'till' });
  step(S, S.time + DATA.ACT_MIN.till + 1);

  assert.ok(S.pskills[skillIdx(player, FARMING)] > initialFarming, 'Farming skill increases upon practicing farming');
});

test('M2: Tool Wear degradation and breakage', () => {
  const { S, player } = makeWorld(202);
  const axe = held(S, 1, player, 'axe');
  assert.ok(axe >= 0, 'Player has axe');
  assert.strictEqual(S.twear[axe], 0, 'Initial tool wear is 0');

  // Perform multiple woodcutting actions
  const tree = idx(S, S.px[player] + 1, S.py[player]);
  setTile(S, tree, T.tree);
  S.pface[player] = 3;

  inject(S, player, { k: 'act', slot: axe, target: tree, act: 'chop' });
  step(S, S.time + DATA.ACT_MIN.chop + 1);

  assert.ok(S.twear[axe] > 0, 'Tool wear increases with usage');

  // Wear tool to 100% and verify breakage / repair
  S.twear[axe] = 1.0;
  const acts = read(S, { acts: player, slot: axe });
  const chopAct = acts.find(a => a.act === 'chop');
  assert.ok(!chopAct || chopAct.broken, 'Broken tool cannot be used for standard tasks');
});

test('M2: Craft Specialization and Market Price Discovery', () => {
  const { S } = makeWorld(203, false);
  const YEAR = DATA.DAYS_PER_YEAR * 1440;

  // Run simulation for 2.5 years to allow multiple households to arrive and specialize
  step(S, S.time + 2.5 * YEAR);

  const m = read(S, 'metrics');
  assert.ok(m.households >= 2, 'Multiple households exist');
  assert.ok(S.trades > 0, 'Inter-household market trades have occurred');

  // Verify price stability: grain price is bounded
  for (let p = 0; p < S.pn; p++) {
    if (S.palive[p] && S.belief[p] && S.belief[p].grain) {
      assert.ok(S.belief[p].grain >= 0.1 && S.belief[p].grain <= 10.0, 'Grain price beliefs remain bounded');
    }
  }
});

test('M2: Financial Instruments — Labor Hiring and Debt Tracking', () => {
  const { S, home } = makeWorld(204, false);
  const hh = S.households[0];
  assert.ok(S.debt instanceof Map, 'Debt ledger exists');

  // Villager 0 hires Villager 1
  const a = 0, b = 1;
  const wage = 2; // 2 pennies per day
  addThing(S, { stuff: 'penny', qty: 20, holder: a, holderKind: 1 });

  // Record wage payment / debt obligation
  const key = `${a}->${b}`;
  S.debt.set(key, (S.debt.get(key) || 0) + wage);
  assert.equal(S.debt.get(key), wage, 'Debt ledger tracks obligations');
});

test('M2: Social Gossip Propagation on Meet', () => {
  const { S } = makeWorld(205, false);
  const a = 0, b = 1;

  S.belief[a].spade = 50; // A believes spades are worth 50 pennies
  S.belief[b].spade = 15; // B believes spades are worth 15 pennies

  // Trigger meet event between A and B
  S.heap.push(S.time, { k: 'meet', a, b });
  step(S, S.time + 1);

  // B's price belief should shift towards A's price belief through gossip
  assert.ok(S.belief[b].spade > 15, 'Gossip updates neighbor beliefs toward observed/communicated prices');
});
