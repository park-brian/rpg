const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createSim, makeWorld, idx, setTile, addPerson, addThing, held, count,
  ruleNeeds, ruleMove, ruleGo, affordances, chooseAct, applyAct, ruleBuild,
  ruleLand, rulePairing, ruleBirths, ruleArrivals, die, step,
  DATA, T, ACT
} = require('../../src/game.js');

test('Rule 1: Needs Decay and Shelter Warmth', () => {
  const S = createSim(1);
  const p = addPerson(S, { name: 'Bran', x: 2, y: 2, age: 25 });
  S.pneeds[p * 5] = 100;     // Food
  S.pneeds[p * 5 + 1] = 100; // Sleep
  S.pneeds[p * 5 + 2] = 100; // Warmth

  // Advance outdoors in cold season
  S.season = 0.1; // Cold winter
  ruleNeeds(S, p, 60); // 60 minutes
  assert.ok(S.pneeds[p * 5] < 100, 'Food should decay over time');
  assert.ok(S.pneeds[p * 5 + 1] < 100, 'Sleep should decay over time');
  assert.ok(S.pneeds[p * 5 + 2] < 100, 'Warmth should drop outdoors in winter');

  // Place inside a hut
  const hutTile = idx(S, 2, 2);
  setTile(S, hutTile, T.hut);
  ruleNeeds(S, p, 60);
  // Inside a hut, warmth recovers
  assert.ok(S.pneeds[p * 5 + 2] > 0, 'Warmth is restored inside hut');
});

test('Rule 2: Physics & Affordances (tool actions mutate the world)', () => {
  const S = createSim(1);
  const p = addPerson(S, { name: 'Player', x: 10, y: 10 });
  const frontTile = idx(S, 10, 11);
  S.pface[p] = 0; // facing south towards (10, 11)

  // 1. Chopping a tree with an axe
  setTile(S, frontTile, T.tree);
  const axe = addThing(S, { stuff: 'axe', qty: 1, holder: p, holderKind: 1 });
  const affChop = affordances(S, p, frontTile, axe);
  assert.ok(affChop.some(a => a.act === 'chop'), 'Axe on tree affords chop');

  const chosenChop = chooseAct(S, p, axe, frontTile, 'chop');
  applyAct(S, p, frontTile, chosenChop);
  assert.strictEqual(S.tiles[frontTile], T.grass, 'Chopped tree becomes grass');
  assert.strictEqual(count(S, 1, p, 'log'), 2, 'Chopping tree yields 2 logs');

  // 2. Whittling a spade from a log with a knife
  const knife = addThing(S, { stuff: 'knife', qty: 1, holder: p, holderKind: 1 });
  const affWhittle = affordances(S, p, frontTile, knife);
  const whittleItem = affWhittle.find(a => a.act === 'whittle');
  assert.ok(whittleItem, 'Knife + log affords whittle');

  applyAct(S, p, frontTile, whittleItem);
  assert.strictEqual(count(S, 1, p, 'spade'), 1, 'Whittling produces a spade');
  assert.strictEqual(count(S, 1, p, 'log'), 1, 'Whittling consumes 1 log');

  // 3. Tilling ground with spade
  const spade = held(S, 1, p, 'spade');
  const chosenTill = chooseAct(S, p, spade, frontTile, 'till');
  applyAct(S, p, frontTile, chosenTill);
  assert.strictEqual(S.tiles[frontTile], T.tilled, 'Tilling turns grass to tilled ground');

  // 4. Sowing grain
  const grain = addThing(S, { stuff: 'grain', qty: 5, holder: p, holderKind: 1 });
  const chosenSow = chooseAct(S, p, grain, frontTile, 'sow');
  applyAct(S, p, frontTile, chosenSow);
  assert.strictEqual(S.tiles[frontTile], T.crop, 'Sowing grain creates crop tile');
  assert.strictEqual(count(S, 1, p, 'grain'), 4, 'Sowing consumes 1 grain seed');
});

test('Rule 2 & 6: Hut Construction Project from parts', () => {
  const S = createSim(1);
  const site = idx(S, 15, 15);
  const p = addPerson(S, { name: 'Builder', x: 14, y: 15, home: site });
  setTile(S, site, T.grass);

  // Supply parts: 4 logs, 4 thatch
  addThing(S, { stuff: 'log', qty: 4, holder: site, holderKind: 2 });
  addThing(S, { stuff: 'thatch', qty: 4, holder: site, holderKind: 2 });

  // Rule build steps
  for (let i = 0; i < 15; i++) {
    ruleBuild(S, p, site);
    if (S.tiles[site] === T.hut) break;
  }
  assert.strictEqual(S.tiles[site], T.hut, 'Hut must be completed after required hours');
  assert.strictEqual(S.projects.has(site), false, 'Project is cleared when hut completes');
});

test('Rule 6, 7, 9: Social lifecycle (Marriage, Births, and Inheritance)', () => {
  const S = createSim(1);
  const homeA = idx(S, 20, 20);
  setTile(S, homeA, T.hut);
  S.households.push({ home: homeA, founded: S.time });

  const hal = addPerson(S, { name: 'Hal', x: 19, y: 20, age: 26, home: homeA });
  const edda = addPerson(S, { name: 'Edda', x: 21, y: 20, age: 24, home: homeA });

  // Set positive regard
  S.regard[hal][edda] = 80;
  S.regard[edda][hal] = 80;

  rulePairing(S);
  assert.strictEqual(S.ppartner[hal], edda, 'Hal and Edda should pair off');
  assert.strictEqual(S.ppartner[edda], hal);

  // Provide provisions for child birth
  addThing(S, { stuff: 'grain', qty: 1200, holder: homeA, holderKind: 2 });
  S.plastBirth[hal] = -1000000;
  S.plastBirth[edda] = -1000000;

  const prevPn = S.pn;
  // Trigger birth condition deterministically
  const origRng = S.rng;
  const mockRng = () => 0.001; // < 0.006
  mockRng.pick = a => a[0];
  mockRng.int = n => 0;
  S.rng = mockRng;

  ruleBirths(S);
  assert.strictEqual(S.pn, prevPn + 1, 'Child should be born');
  S.rng = origRng;

  // Death & Inheritance
  const axe = addThing(S, { stuff: 'axe', qty: 1, holder: hal, holderKind: 1 });
  die(S, hal, 'age', 'Hal died peacefully.');
  assert.strictEqual(S.palive[hal], 0);
  assert.strictEqual(count(S, 2, homeA, 'axe'), 1, 'Axe must transfer to home storage upon death');
});
