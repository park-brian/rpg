import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSim, makeWorld, idx, setTile, tileAt, walkable, personAt, ageYears, addPerson,
  stockKey, stockOf, stockAdd, setQty, setHolder, addThing, held, hands, count, moveThing,
  read, inject, step,
  DATA, T
} from '../../src/sim.js';

test('World initialization and grid connectivity', () => {
  const S = createSim(42, { w: 80, h: 48 });
  assert.strictEqual(S.W, 80);
  assert.strictEqual(S.H, 48);
  assert.ok(S.tiles.length === 80 * 48);

  // Check road and ford exist
  const roadY = S.H >> 1;
  let hasFord = false;
  let hasPath = false;
  for (let x = 0; x < S.W; x++) {
    const t = S.tiles[idx(S, x, roadY)];
    if (t === T.ford) hasFord = true;
    if (t === T.path) hasPath = true;
  }
  assert.ok(hasFord, 'Road must have a ford across the river');
  assert.ok(hasPath, 'Road must have path tiles');
});

test('Person State-of-Arrays (SoA) allocation and lifecycle', () => {
  const S = createSim(1);
  const pId = addPerson(S, { name: 'Gwen', x: 10, y: 12, planner: 0, age: 20, home: -1 });

  assert.strictEqual(pId, 0);
  assert.strictEqual(S.pn, 1);
  assert.strictEqual(S.pname[pId], 'Gwen');
  assert.strictEqual(S.px[pId], 10);
  assert.strictEqual(S.py[pId], 12);
  assert.strictEqual(S.palive[pId], 1);
  assert.strictEqual(Math.round(ageYears(S, pId)), 20);

  // Check 5 needs are initialized
  for (let k = 0; k < 5; k++) {
    const needVal = S.pneeds[pId * 5 + k];
    assert.ok(needVal >= 50 && needVal <= 100, `Need ${k} value ${needVal} out of expected range`);
  }

  // personAt spatial query
  assert.strictEqual(personAt(S, 10, 12), pId + 1);
  assert.strictEqual(personAt(S, 11, 12), 0);
});

test('Thing Management: Stacking, Holdings, and Dual-Index Consistency', () => {
  const S = createSim(1);
  const p = addPerson(S, { name: 'Aldo', x: 5, y: 5, age: 30 });

  // Add stackable items (grain)
  const g1 = addThing(S, { stuff: 'grain', qty: 10, holder: p, holderKind: 1 });
  assert.strictEqual(count(S, 1, p, 'grain'), 10);

  // Adding more grain to same holder merges stack
  const g2 = addThing(S, { stuff: 'grain', qty: 5, holder: p, holderKind: 1 });
  assert.strictEqual(g1, g2, 'Stackable items should merge into single thing ID');
  assert.strictEqual(count(S, 1, p, 'grain'), 15);

  // Add tools (tools do not merge)
  const axe1 = addThing(S, { stuff: 'axe', qty: 1, holder: p, holderKind: 1 });
  const axe2 = addThing(S, { stuff: 'axe', qty: 1, holder: p, holderKind: 1 });
  assert.notStrictEqual(axe1, axe2, 'Tools must not merge stacks');
  assert.strictEqual(count(S, 1, p, 'axe'), 2);

  // Move things between person and tile site
  const tileId = idx(S, 5, 6);
  moveThing(S, g1, tileId, 2, 7);
  assert.strictEqual(count(S, 1, p, 'grain'), 8);
  assert.strictEqual(count(S, 2, tileId, 'grain'), 7);

  // Hands inspection
  const h = hands(S, p);
  assert.ok(h.includes(g1));
  assert.ok(h.includes(axe1));
  assert.ok(h.includes(axe2));
});

test('Ground Items Underfoot: Standing directly on top of items prioritizes pick up', () => {
  const { S, player } = makeWorld(123);
  const here = idx(S, S.px[player], S.py[player]);

  // 1. Place bread directly on the tile under the player's feet
  const breadId = addThing(S, { stuff: 'bread', qty: 1, holder: here, holderKind: 2 });
  assert.strictEqual(count(S, 2, here, 'bread'), 1, 'Bread must be on the ground underfoot');

  // Verify read({ acts }) prioritizes picking up the bread
  const acts = read(S, { acts: player });
  assert.ok(acts.length > 0);
  assert.strictEqual(acts[0].act, 'take', 'Top affordance must be take for bread underfoot');
  assert.ok(acts[0].label.includes('bread'));

  // Execute take intent
  inject(S, player, { k: 'act', act: 'take', slot: acts[0].slot, target: acts[0].tile });
  step(S, S.time + 10);
  assert.strictEqual(count(S, 2, here, 'bread'), 0, 'Bread picked up from ground');
  assert.strictEqual(count(S, 1, player, 'bread'), 2, 'Player now has bread in inventory');
});

test('Tool Drop and Immediate Pickup: Dropped axe can be picked right back up', () => {
  const { S, player } = makeWorld(456);
  const axeSlot = held(S, 1, player, 'axe');
  assert.ok(axeSlot >= 0, 'Player starts with axe in hand');
  const here = idx(S, S.px[player], S.py[player]);

  // Drop the axe
  inject(S, player, { k: 'act', act: 'drop', slot: axeSlot, target: here });
  step(S, S.time + 5);

  assert.strictEqual(count(S, 1, player, 'axe'), 0, 'Player dropped axe');
  assert.strictEqual(count(S, 2, here, 'axe'), 1, 'Axe is lying on ground');

  // Player checks affordances with now-empty/reset slot
  const acts = read(S, { acts: player, slot: -1 });
  assert.ok(acts.length > 0);
  assert.strictEqual(acts[0].act, 'take', 'Top affordance is picking up the dropped axe');
  assert.ok(acts[0].label.includes('axe'));

  // Pick up the dropped axe
  inject(S, player, { k: 'act', act: 'take', slot: acts[0].slot, target: acts[0].tile });
  step(S, S.time + 5);

  assert.strictEqual(count(S, 1, player, 'axe'), 1, 'Player picked axe back up');
  assert.strictEqual(count(S, 2, here, 'axe'), 0, 'Ground is clear');
});
