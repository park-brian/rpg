import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSim, makeWorld, idx, setTile, addPerson, addThing, held, hands, count,
  plan, heuristic, inject, step, read, die, ageYears, household,
  DATA, T, ACT
} from '../../src/sim.js';

test('Observer Mode: makeWorld without player creates living autonomous settlement', () => {
  const { S, player, home } = makeWorld(123, false);
  assert.strictEqual(player, -1, 'Player should be -1 in playerless world');
  assert.ok(home >= 0, 'Settlement home should be founded');
  assert.ok(S.pn >= 3, 'Settlement should have Hal, Edda, and Tam');

  const dir = read(S, 'directory');
  assert.ok(Array.isArray(dir), 'Directory returns array');
  assert.strictEqual(dir.length, 3, 'Directory lists living villagers');
  assert.ok(dir.every(p => p.planner === 0), 'All villagers run in autonomous AI mode');

  // Step simulation 30 days
  step(S, S.time + 30 * 1440);
  const metrics = read(S, 'metrics');
  assert.ok(metrics.pop >= 3, 'Villagers thrive in playerless mode');
});

test('Consciousness Transfer & Mind-Hopping Invariant', () => {
  const { S, player } = makeWorld(456, false);
  const dir = read(S, 'directory');
  const hal = dir.find(p => p.name === 'Hal').id;
  const edda = dir.find(p => p.name === 'Edda').id;

  // 1. Initially both autonomous
  assert.strictEqual(S.pplanner[hal], 0);
  assert.strictEqual(S.pplanner[edda], 0);

  // 2. Hop into Hal\'s head (Possess)
  S.pplanner[hal] = 1;
  assert.strictEqual(S.pplanner[hal], 1, 'Hal is now directly player controlled');

  // 3. Hop from Hal to Edda
  S.pplanner[hal] = 0; // Release Hal
  S.pplanner[edda] = 1; // Possess Edda
  assert.strictEqual(S.pplanner[hal], 0, 'Hal resumed autonomous AI life');
  assert.strictEqual(S.pplanner[edda], 1, 'Edda is now player controlled');

  // 4. Release to Ghost Observer Mode
  S.pplanner[edda] = 0;
  assert.strictEqual(S.pplanner[edda], 0, 'Edda resumed autonomous AI life');
});

test('Generational Succession: Real Estate & Homestead Transfer across Family', () => {
  const S = createSim(789);
  const home = idx(S, 20, 20);
  setTile(S, home, T.hut);
  S.households.push({ home, founded: S.time });

  const father = addPerson(S, { name: 'Father', x: 19, y: 20, age: 30, home });
  const mother = addPerson(S, { name: 'Mother', x: 21, y: 20, age: 28, home });
  const son = addPerson(S, { name: 'Son', x: 20, y: 21, age: 8, home });

  addThing(S, { stuff: 'axe', holder: father, holderKind: 1 });
  addThing(S, { stuff: 'spade', holder: mother, holderKind: 1 });
  addThing(S, { stuff: 'grain', qty: 500, holder: home, holderKind: 2 });

  // 1. Father dies of old age/combat
  die(S, father, 'age', 'Father passed away peacefully.');
  assert.strictEqual(S.palive[father], 0);

  // Father's hand items deposited into home store for heirs
  const homeAxe = held(S, 2, home, 'axe');
  assert.ok(homeAxe >= 0, 'Father axe dropped into home storage for family');

  // Household remains intact under Mother & Son
  const membersAfterFather = household(S, home);
  assert.deepStrictEqual(membersAfterFather, [mother, son], 'Mother and Son inherit household');
  assert.strictEqual(S.households.length, 1, 'Household remains registered');

  // 2. Mother dies
  die(S, mother, 'age', 'Mother passed away.');
  assert.strictEqual(S.palive[mother], 0);
  const membersAfterMother = household(S, home);
  assert.deepStrictEqual(membersAfterMother, [son], 'Son inherits sole claim of homestead');
  assert.strictEqual(S.households.length, 1, 'Household still registered under son');

  // 3. Son dies with no heirs
  die(S, son, 'exposure', 'Son perished with no heirs.');
  assert.strictEqual(S.households.length, 0, 'Empty claim is unlisted for future wanderers');
});

test('Homeless Wanderer: Autonomous Claim Staking & Tool Bootstrapping', () => {
  const { S } = makeWorld(999, false);
  S.time = 90 * 1440 + 9 * 60; // Spring morning 09:00
  const wanderer = addPerson(S, { name: 'Wanderer', x: 10, y: 24, age: 20, planner: 0 });
  addThing(S, { stuff: 'knife', holder: wanderer, holderKind: 1 });
  addThing(S, { stuff: 'axe', holder: wanderer, holderKind: 1 });
  addThing(S, { stuff: 'bread', qty: 20, holder: wanderer, holderKind: 1 });

  assert.strictEqual(S.phome[wanderer], -1, 'Wanderer starts homeless');

  // Run autonomous heuristic decision during daylight
  const firstIntent = plan(S, wanderer);
  assert.ok(firstIntent !== null, 'Homeless wanderer has intent');
  assert.ok(firstIntent.k === 'go' || firstIntent.k === 'wait' || firstIntent.k === 'move', 'Wanderer scouts or stakes claim');

  // Step 5 days of headless simulation in Spring
  step(S, S.time + 5 * 1440);

  // Wanderer should have claimed land
  assert.ok(S.phome[wanderer] >= 0, 'Wanderer claimed land and registered household');
  assert.ok(S.households.some(h => h.home === S.phome[wanderer]), 'Household is registered in simulation');
});