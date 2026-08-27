import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSim, makeWorld, idx, setTile, addPerson, addThing, held, hands, count,
  plan, heuristic, inject, cancelAct, step,
  DATA, T, ACT
} from '../../src/sim.js';

test('Input Planner: Queueing and Executing Player Intents', () => {
  const { S, player } = makeWorld(10);
  const startX = S.px[player];
  const startY = S.py[player];

  // Inject move intent (d=3: East)
  inject(S, player, { k: 'move', d: 3 });
  step(S, S.time + 1);

  assert.strictEqual(S.px[player], startX + 1, 'Player should move East');
  assert.strictEqual(S.py[player], startY);

  // Inject eating intent
  const bread = hands(S, player).find(t => S.tstuff[t] === 'bread');
  assert.ok(bread !== undefined, 'Player should start with bread');
  S.pneeds[player * 5] = 20;

  inject(S, player, { k: 'act', slot: bread, act: 'eat' });
  step(S, S.time + DATA.ACT_MIN.eat + 0.5);

  assert.ok(S.pneeds[player * 5] > 50, 'Eating restores hunger need');
  assert.strictEqual(count(S, 1, player, 'bread'), 0, 'Bread loaf is consumed');
});

test('Heuristic Planner: Priority hierarchy handles starvation and sleep', () => {
  const S = createSim(5);
  const home = idx(S, 10, 10);
  setTile(S, home, T.hut);
  S.households.push({ home, founded: S.time });

  const npc = addPerson(S, { name: 'NPC', x: 10, y: 10, planner: 0, home });

  // 1. Starving NPC with berries in pocket eats immediately
  addThing(S, { stuff: 'berries', qty: 2, holder: npc, holderKind: 1 });
  S.pneeds[npc * 5] = 25; // Critical hunger
  const planEat = heuristic(S, npc);
  assert.strictEqual(planEat.k, 'act');
  assert.strictEqual(planEat.act, 'eat');

  // 2. Exhausted NPC goes to sleep
  S.pneeds[npc * 5] = 80;
  S.pneeds[npc * 5 + 1] = 10; // Critical sleep exhaustion
  const planSleep = heuristic(S, npc);
  assert.strictEqual(planSleep.k, 'sleep');
});

test('Action Spans & Cancellation: Walking away interrupts work without progress', () => {
  const { S, player } = makeWorld(31);
  const me = player;

  // Locate adjacent tree
  let tree = -1;
  for (let i = 0; i < S.tiles.length; i++) {
    if (S.tiles[i] === T.tree && S.tiles[i - 1] === T.path) {
      tree = i;
      break;
    }
  }
  if (tree < 0) {
    tree = idx(S, S.px[me] + 1, S.py[me]);
    setTile(S, tree, T.tree);
  }

  S.px[me] = tree % S.W - 1;
  S.py[me] = (tree / S.W) | 0;
  S.pface[me] = 3; // Facing east towards tree

  const axe = hands(S, me).find(t => S.tstuff[t] === 'axe');
  assert.ok(axe !== undefined);

  // Start chopping
  inject(S, me, { k: 'act', slot: axe, act: 'chop' });
  step(S, S.time + DATA.ACT_MIN.chop * 0.5);

  // Tree should still be standing halfway through
  assert.strictEqual(S.tiles[tree], T.tree, 'Tree is not felled midway');
  assert.strictEqual(count(S, 1, me, 'log'), 0);

  // Interrupt by moving away
  inject(S, me, { k: 'move', d: 1 }); // North
  step(S, S.time + DATA.ACT_MIN.chop);

  // Action was cancelled: tree remains standing, no logs granted
  assert.strictEqual(S.tiles[tree], T.tree, 'Tree remained standing after interruption');
  assert.strictEqual(count(S, 1, me, 'log'), 0, 'No logs granted from interrupted work');
});

test('Autonomy Mode: Player character can toggle to autonomous AI heuristic control', () => {
  const { S, player } = makeWorld(77);
  assert.strictEqual(S.pplanner[player], 1, 'Player starts in direct control mode');

  // Toggle to autonomous mode
  S.pplanner[player] = 0;
  S.pneeds[player * 5] = 20; // Critical hunger

  // Autonomous planner chooses self-preservation action
  const nextPlan = plan(S, player);
  assert.ok(nextPlan !== null, 'Autonomous mode produces intent');
  assert.strictEqual(nextPlan.act, 'eat', 'Autonomous character eats held bread');

  // Step simulation under autonomy
  step(S, S.time + 10);
  assert.ok(S.pneeds[player * 5] > 50, 'Autonomous character restored hunger');
});

test('Death & Succession Notification: onDeath fires on fatal events with cause', () => {
  const { S, player } = makeWorld(88);
  let deathFired = false;
  let deadPerson = -1;
  let deathCause = '';

  S.onDeath = (p, cause, text) => {
    deathFired = true;
    deadPerson = p;
    deathCause = cause;
  };

  // Deplete hunger to 0
  S.pneeds[player * 5] = 0;
  step(S, S.time + 70); // Trigger needs check

  assert.strictEqual(deathFired, true, 'onDeath callback must fire on death');
  assert.strictEqual(deadPerson, player, 'Dead person matches player');
  assert.strictEqual(deathCause, 'starved', 'Cause is starvation');
  assert.strictEqual(S.palive[player], 0, 'Player marked not alive');
});
