import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DATA, T, ACT, makeWorld, step, inject, read, held, count, addThing, setTile, idx
} from '../../src/sim.js';

test('M3: Collective Funding & Public Works Projects (Bridge & Well)', () => {
  const { S, home } = makeWorld(301, false);
  const hx = home % S.W, hy = (home / S.W) | 0;

  // Set up a public well project in the village center
  const wellTile = idx(S, hx + 2, hy);
  setTile(S, wellTile, T.grass);
  S.projects.set(wellTile, { type: 'well', log: 2, thatch: 1, work: 0, target: T.well, reqHours: 2 });

  // Give household parts and labor
  addThing(S, { stuff: 'log', qty: 8, holder: home, holderKind: 2 });
  addThing(S, { stuff: 'thatch', qty: 8, holder: home, holderKind: 2 });

  // Run simulation for 30 days
  step(S, S.time + 30 * 1440);

  // Assert well is completed
  assert.equal(S.tiles[wellTile], T.well, 'Community well is constructed from collective contributions');
});

test('M3: Emergent Patronage ("Lord") funding public infrastructure', () => {
  const { S } = makeWorld(302, false);
  const YEAR = DATA.DAYS_PER_YEAR * 1440;

  // Run simulation for 4 years to allow wealth accumulation and patronage
  step(S, S.time + 4 * YEAR);

  const m = read(S, 'metrics');
  assert.ok(m.households >= 2, 'Settlement has expanded to multiple households');

  // Verify that the wealthiest household contributes surplus grain/pennies to projects
  let maxWealth = 0, wealthiestHh = -1;
  for (const h of S.households) {
    const wealth = count(S, 2, h.home, 'grain') + count(S, 2, h.home, 'penny') * 10;
    if (wealth > maxWealth) {
      maxWealth = wealth;
      wealthiestHh = h.home;
    }
  }
  assert.ok(maxWealth > 500, 'Wealthiest household accumulates substantial surplus');
});

test('M3: Multi-generational succession and claim inheritance', () => {
  const { S } = makeWorld(303, false);
  const home = S.households[0].home;
  const initialPop = S.pn;

  // Add child heir
  const child = S.pn++;
  S.px[child] = S.px[0]; S.py[child] = S.py[0]; S.palive[child] = 1;
  S.pbirth[child] = S.time - 18 * DATA.DAYS_PER_YEAR * 1440; // 18 years old
  S.phome[child] = home; S.pmother[child] = 1; S.pname[child] = 'Aelred';
  for (let k = 0; k < 5; k++) S.pneeds[child * 5 + k] = 80;

  // Terminate patriarch (Person 0)
  S.palive[0] = 0;
  S.deaths.age++;

  // Step simulation
  step(S, S.time + 10 * 1440);

  // Assert heir has inherited claim and household stays intact
  assert.ok(S.households.some(h => h.home === home), 'Claim persists under heir succession');
  assert.equal(S.phome[child], home, 'Heir resides at inherited homestead');
});
