import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSim, makeWorld, idx, setTile, addPerson, addThing, held, hands, count,
  plan, heuristic, inject, step, read, die, ageYears, household, affordances,
  applyAct, DATA, T, ACT
} from '../../src/sim.js';

test('Multi-Occupant Cabin: Family shares shelter without spatial collision lock', () => {
  const { S, home } = makeWorld[101] ? makeWorld(101, false) : makeWorld(101, false);
  setTile(S, home, T.hut);

  const hal = addPerson(S, { name: 'Hal', x: home % S.W, y: (home / S.W) | 0, home });
  const edda = addPerson(S,{ name: 'Edda', x: home % S.W, y: (home / S.W) | 0, home });
  const tam = addPerson(S, { name: 'Tam', x: home % S.W, y: (home / S.W) | 0, home });

  assert.strictEqual(S.px[hal], S.px[edda], 'Hal and Edda can both enter hut');
  assert.strictEqual(S.px[edda], S.px[tam], 'Edda and Tam can both enter hut');
});

test('Cooking Physics: Baking requires lit hearth; meat roasting requires fire', () => {
  const S = createSim(202);
  const home = idx(S, 20, 20);
  setTile(S, home, T.hut);
  S.households.push({ home, founded: S.time });

  const baker = addPerson(S, { name: 'Baker', x: 20, y: 20, home });
  const flourId = addThing(S, { stuff: 'flour', qty: 1, holder: baker, holderKind: 1 });

  // 1. Knead flour into dough
  const kneadRes = applyAct(S, baker, home, { act: 'knead', slot: flourId });
  assert.strictEqual(kneadRes.act, ACT.knead, 'Knead action succeeds');
  const doughId = held(S, 1, baker, 'dough');
  assert.ok(doughId >= 0, 'Dough created in hands');

  // 2. Bake dough without fire (cold hearth)
  const hearth = S.hearths.get(home) || { litUntil: 0, firewood: 0 };
  hearth.litUntil = 0;
  S.hearths.set(home, hearth);

  const coldBakeRes = applyAct(S, baker, home, { act: 'bake', slot: doughId });
  assert.strictEqual(coldBakeRes.act, ACT.idle, 'Cannot bake without lit hearth');

  // 3. Stoke hearth with firewood
  const logId = addThing(S, { stuff: 'log', qty: 1, holder: baker, holderKind: 1 });
  const stokeRes = applyAct(S, baker, home, { act: 'stoke', slot: logId });
  assert.strictEqual(stokeRes.act, ACT.stoke, 'Hearth stoked');
  assert.ok(S.hearths.get(home).litUntil > S.time, 'Hearth is now burning');

  // 4. Bake dough in lit hearth
  const hotBakeRes = applyAct(S, baker, home, { act: 'bake', slot: doughId });
  assert.strictEqual(hotBakeRes.act, ACT.bake, 'Baking succeeds in hot hearth');
  assert.ok(held(S, 1, baker, 'bread') >= 0, 'Bread loaf baked');
});

test('Thermal Survival: Hearth warmth relieves hypothermia and prevents exposure death', () => {
  const S = createSim(303);
  const home = idx(S, 20, 20);
  setTile(S, home, T.hut);
  S.households.push({ home, founded: S.time });

  const villager = addPerson(S, { name: 'Villager', x: 20, y: 20, home });
  S.pneeds[villager * 5 + 2] = 0; // Freezing warmth = 0
  S.pexposed[villager] = 2; // 2 days of cold exposure

  // Stoke hearth with fresh firewood
  S.hearths.set(home, { litUntil: S.time + 1440, firewood: 4 });

  // Step 2 hours inside the warm cabin
  step(S, S.time + 120);

  assert.ok(S.pneeds[villager * 5 + 2] > 80, 'Body warmth rapidly restored by hearth');
  assert.strictEqual(S.pexposed[villager], 0, 'Exposure counter cleared to 0');
  assert.strictEqual(S.palive[villager], 1, 'Villager survives');
});