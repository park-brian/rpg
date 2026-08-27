import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DATA, T, ACT, makeWorld, step, inject, read, held, count, addThing, setTile, idx
} from '../../src/sim.js';

test('M1: Food Processing — Milling Grain to Flour and Baking Bread', () => {
  const { S, player, home } = makeWorld(101);
  assert.ok(player >= 0, 'Player should exist');

  // Place player at home cabin with lit hearth
  setTile(S, home, T.hut);
  S.px[player] = home % S.W;
  S.py[player] = (home / S.W) | 0;
  S.hearths.set(home, { litUntil: S.time + 1440, firewood: 4 });

  // Add grain to player hands
  const grainId = addThing(S, { stuff: 'grain', qty: 10, holder: player, holderKind: 1 });
  assert.ok(count(S, 1, player, 'grain') >= 10, 'Player has grain');

  // Check affordances for milling grain
  const acts = read(S, { acts: player, slot: grainId });
  const millAct = acts.find(a => a.act === 'mill');
  assert.ok(millAct, 'Holding grain affords milling into flour');

  // Execute mill act
  inject(S, player, { k: 'act', slot: grainId, act: 'mill' });
  step(S, S.time + DATA.ACT_MIN.mill + 1);

  assert.ok(count(S, 1, player, 'flour') > 0, 'Milling produces flour');

  // Check affordances for baking flour/dough into bread
  const flourId = held(S, 1, player, 'flour');
  assert.ok(flourId >= 0, 'Flour is held');
  const bakeActs = read(S, { acts: player, slot: flourId });
  const bakeAct = bakeActs.find(a => a.act === 'bake' || a.act === 'knead');
  assert.ok(bakeAct, 'Holding flour affords food preparation');

  // Execute bake act at hot hearth
  inject(S, player, { k: 'act', slot: flourId, act: 'bake' });
  step(S, S.time + DATA.ACT_MIN.bake + 1);

  assert.ok(count(S, 1, player, 'bread') > 0, 'Baking flour produces bread');
});

test('M1: Storage Shed Construction on Grain Surplus', () => {
  const { S, home } = makeWorld(102, false);
  const hx = home % S.W, hy = (home / S.W) | 0;

  // Simulate established household with massive grain surplus
  addThing(S, { stuff: 'grain', qty: 2500, holder: home, holderKind: 2 });
  addThing(S, { stuff: 'log', qty: 10, holder: home, holderKind: 2 });
  addThing(S, { stuff: 'thatch', qty: 10, holder: home, holderKind: 2 });

  // Run simulation for 60 days
  step(S, S.time + 60 * 1440);

  // Check if a shed was planned or built near home
  let hasShed = false;
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      const tile = S.tiles[idx(S, hx + dx, hy + dy)];
      if (tile === T.shed || (S.projects.has(idx(S, hx + dx, hy + dy)) && S.projects.get(idx(S, hx + dx, hy + dy)).type === 'shed')) {
        hasShed = true;
      }
    }
  }
  assert.ok(hasShed, 'Surplus triggers shed construction project');
});

test('M1: Fence Construction for Crop Protection', () => {
  const { S, player } = makeWorld(103);
  S.pface[player] = 3; const grass = idx(S, S.px[player] + 1, S.py[player]);
  setTile(S, grass, T.grass);

  // Give player logs and a knife/axe
  const logId = addThing(S, { stuff: 'log', qty: 4, holder: player, holderKind: 1 });
  const acts = read(S, { acts: player, slot: logId });
  const fenceAct = acts.find(a => a.act === 'fence');
  assert.ok(fenceAct, 'Holding log affords building fence on open grass');

  inject(S, player, { k: 'act', slot: logId, target: grass, act: 'fence' });
  step(S, S.time + DATA.ACT_MIN.fence + 1);

  assert.equal(S.tiles[grass], T.fence, 'Target tile becomes fence');
});
