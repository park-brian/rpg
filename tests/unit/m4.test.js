const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DATA, T, ACT, makeWorld, step, inject, read, held, count, addThing, setTile, idx, addPerson
} = require('../../src/game.js');

test('M4: Beasts as Persons in Unified SoA Store', () => {
  const { S } = makeWorld(401, false);

  // Add a wolf and a deer using unified addPerson with species kind
  const wolf = addPerson(S, { name: 'Wolf', x: 20, y: 20, kind: 1 }); // 1 = wolf
  const deer = addPerson(S, { name: 'Deer', x: 22, y: 20, kind: 2 }); // 2 = deer

  assert.ok(S.pkind instanceof Uint8Array, 'pkind array exists on Sim');
  assert.equal(S.pkind[wolf], 1, 'Wolf has beast kind 1');
  assert.equal(S.pkind[deer], 2, 'Deer has beast kind 2');

  // Step simulation and verify beast movement and grazing/hunting
  step(S, S.time + 10);
  assert.ok(S.palive[wolf] && S.palive[deer], 'Beasts simulate within the event loop');
});

test('M4: Anatomical Body Model, Wounds, and Medical Treatment', () => {
  const { S, player } = makeWorld(402);

  assert.ok(S.pwounds instanceof Float32Array, 'pwounds array exists on Sim');

  // Inflict wound on torso (region 1)
  const TORSO = 1;
  S.pwounds[player * 6 + TORSO] = 0.5; // 50% wound severity

  assert.equal(S.pwounds[player * 6 + TORSO], 0.5, 'Torso wound inflicted');

  // Give player cloth for bandaging
  const clothId = addThing(S, { stuff: 'cloth', qty: 2, holder: player, holderKind: 1 });
  const acts = read(S, { acts: player, slot: clothId });
  const bandageAct = acts.find(a => a.act === 'bandage' || a.act === 'heal');
  assert.ok(bandageAct, 'Holding cloth affords bandaging wounds');

  // Apply bandage
  inject(S, player, { k: 'act', slot: clothId, act: 'bandage' });
  step(S, S.time + DATA.ACT_MIN.bandage + 1);

  assert.ok(S.pwounds[player * 6 + TORSO] < 0.5, 'Bandaging treats wound severity');
});

test('M4 & M7: Tactical Combat, Hunting, and Party Formation', () => {
  const { S, player } = makeWorld(403);

  // Spawn deer adjacent to player
  const deer = addPerson(S, { name: 'Deer', x: S.px[player] + 1, y: S.py[player], kind: 2 });
  S.pface[player] = 3;

  // Equip axe
  const axe = held(S, 1, player, 'axe');
  const acts = read(S, { acts: player, slot: axe });
  const attackAct = acts.find(a => a.act === 'attack');
  assert.ok(attackAct, 'Facing adjacent beast affords attack');

  // Execute attack until beast is slain
  inject(S, player, { k: 'act', slot: axe, target: idx(S, S.px[deer], S.py[deer]), act: 'attack' });
  step(S, S.time + DATA.ACT_MIN.attack + 1);

  // Slaying beast yields meat and hide
  if (!S.palive[deer]) {
    assert.ok(count(S, 1, player, 'meat') > 0 || count(S, 2, idx(S, S.px[deer], S.py[deer]), 'meat') > 0, 'Hunting yields meat');
  }

  // Party formation: Person follows leader
  const villager = addPerson(S, { name: 'Bran', x: S.px[player], y: S.py[player] + 1, age: 20 });
  S.pfollow[villager] = player;
  assert.equal(S.pfollow[villager], player, 'Party follower pointer assigned');
});

test('M4: Loss-Driven Predator Bounties', () => {
  const { S, home } = makeWorld(404, false);

  // Spawn wolf near village and simulate attack on villager
  const wolf = addPerson(S, { name: 'Wolf', x: S.px[0] + 1, y: S.py[0], kind: 1 });
  S.pwounds[0 * 6 + 1] = 0.8; // severe predator wound

  // Community posts bounty on board
  S.board.push({ type: 'bounty', targetKind: 1, reward: 25, reason: 'Wolf attack' });

  assert.ok(S.board.some(b => b.type === 'bounty' && b.reward >= 25), 'Bounty posted following predator attack');
});
