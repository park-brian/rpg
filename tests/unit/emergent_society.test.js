import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DATA, T, ACT, makeWorld, step, inject, read, held, count, addThing, setTile, idx,
  addPerson, regardOf, regardShift, applyAct
} from '../../src/sim.js';

test('Emergent Society: Friend Hospitality allows food sharing with zero penalty', () => {
  const { S, home } = makeWorld(1001, false);
  const hx = home % S.W, hy = (home / S.W) | 0;

  // Add Host (Hal) and Friend (Mara)
  const hal = addPerson(S, { name: 'Hal', x: hx, y: hy, home, age: 30 });
  const friendCabinTile = idx(S, hx + 5, hy);
  setTile(S, friendCabinTile, T.hut);
  S.households.push({ home: friendCabinTile, founded: S.time });
  const mara = addPerson(S, { name: 'Mara', x: hx + 5, y: hy, home: friendCabinTile, age: 28 });

  // Establish strong mutual friendship (regard >= 30)
  regardShift(S, hal, mara, 40);
  regardShift(S, mara, hal, 40);

  // Store bread in Hal's cabin
  addThing(S, { stuff: 'bread', qty: 2, holder: home, holderKind: 2 });
  const breadInStore = held(S, 2, home, 'bread');
  assert.ok(breadInStore >= 0, 'Bread exists in Hal cabin');

  // Mara walks to Hal's cabin and takes bread
  S.px[mara] = hx;
  S.py[mara] = hy;

  const halInitialRegard = regardOf(S, hal, mara);
  const result = applyAct(S, mara, home, { act: 'take', slot: breadInStore });

  assert.equal(result.act, ACT.take, 'Take action succeeded');
  assert.equal(held(S, 1, mara, 'bread') >= 0, true, 'Mara took the bread');
  assert.ok(regardOf(S, hal, mara) >= halInitialRegard, 'No reputation penalty occurred for friend');
  assert.equal(S.penemy[hal], -1, 'Hal did not become hostile to his friend');
});

test('Emergent Society: Stranger Theft in Line-of-Sight triggers alarm and combat', () => {
  const { S, home } = makeWorld(1002, false);
  const hx = home % S.W, hy = (home / S.W) | 0;

  // Add Owner (Hal) and Stranger (Rogue)
  const hal = addPerson(S, { name: 'Hal', x: hx, y: hy, home, age: 30 });
  const rogue = addPerson(S, { name: 'Rogue', x: hx, y: hy, home: -1, age: 25 });

  // Store bread in Hal's cabin
  addThing(S, { stuff: 'bread', qty: 2, holder: home, holderKind: 2 });
  const breadInStore = held(S, 2, home, 'bread');

  // Hal is awake and in the cabin with Rogue
  S.pneeds[hal * 5 + 1] = 80; // Awake

  const result = applyAct(S, rogue, home, { act: 'take', slot: breadInStore });
  assert.equal(result.act, ACT.take, 'Take action executed');
  assert.ok(regardOf(S, hal, rogue) <= -70, 'Hal regard for thief crashed below -70');
  assert.equal(S.penemy[hal], rogue, 'Hal marked thief as immediate combat target');
});

test('Emergent Society: Unwitnessed Stealth Burglary triggers zero immediate combat', () => {
  const { S, home } = makeWorld(1003, false);
  const hx = home % S.W, hy = (home / S.W) | 0;

  // Move all existing household members far away to the field (no LOS)
  for (let p = 0; p < S.pn; p++) {
    if (S.phome[p] === home) {
      S.px[p] = hx + 20;
      S.py[p] = hy + 20;
    }
  }

  const rogue = addPerson(S, { name: 'Rogue', x: hx, y: hy, home: -1, age: 25 });

  // Store bread in Hal's cabin
  addThing(S, { stuff: 'bread', qty: 2, holder: home, holderKind: 2 });
  const breadInStore = held(S, 2, home, 'bread');

  const halInitialRegard = regardOf(S, 0, rogue);
  const result = applyAct(S, rogue, home, { act: 'take', slot: breadInStore });

  assert.equal(result.act, ACT.take, 'Rogue took bread');
  assert.equal(regardOf(S, 0, rogue), halInitialRegard, 'Unwitnessed theft caused no immediate regard change');
  assert.equal(S.penemy[0], -1, 'Hal is unaware and not hostile');
});

test('Emergent Society: Social Gossip propagates criminal reputation during meet', () => {
  const { S, home } = makeWorld(1004, false);
  const hx = home % S.W, hy = (home / S.W) | 0;

  // Hal hates Rogue (Hal caught Rogue stealing earlier)
  const hal = addPerson(S, { name: 'Hal', x: hx, y: hy, home, age: 30 });
  const mara = addPerson(S, { name: 'Mara', x: hx, y: hy, home, age: 28 });
  const rogue = addPerson(S, { name: 'Rogue', x: hx + 10, y: hy + 10, home: -1, age: 25 });

  // Hal and Mara are close friends (regard = 40)
  regardShift(S, hal, mara, 40);
  regardShift(S, mara, hal, 40);

  // Hal hates Rogue (regard = -80)
  regardShift(S, hal, rogue, -80);

  // Initially Mara has neutral regard for Rogue
  assert.equal(regardOf(S, mara, rogue), 0, 'Mara initially has neutral regard for Rogue');

  // Hal meets Mara
  S.heap.push(S.time, { k: 'meet', a: hal, b: mara });
  step(S, S.time + 1);

  // Mara hears gossip from trusted friend Hal and lowers regard for Rogue
  assert.ok(regardOf(S, mara, rogue) < 0, 'Mara opinion of Rogue turned negative after hearing gossip');
});

test('Emergent Society: Transparent Relationship Inspection', () => {
  const { S, home } = makeWorld(1005, false);
  const hx = home % S.W, hy = (home / S.W) | 0;

  const hal = addPerson(S, { name: 'Hal', x: hx, y: hy, home, age: 30 });
  const edda = addPerson(S, { name: 'Edda', x: hx + 1, y: hy, home, age: 28 });
  const stranger = addPerson(S, { name: 'Stranger', x: hx + 2, y: hy, home: -1, age: 22 });

  // Hal and Edda are partners / kin
  S.ppartner[hal] = edda;
  S.ppartner[edda] = hal;
  regardShift(S, hal, edda, 60);
  regardShift(S, edda, hal, 60);

  // Hal inspects Edda (Spouse / Kin)
  const eddaTile = idx(S, hx + 1, hy);
  const eddaDesc = read(S, { inspect: eddaTile, person: hal });
  assert.equal(eddaDesc.title, 'Edda');
  const eddaRelLine = eddaDesc.lines.find(l => l[0] === 'relation');
  assert.ok(eddaRelLine, 'Relationship line exists');
  assert.ok(eddaRelLine[1].includes('Spouse'), 'Identifies Edda as Spouse');
  const eddaShareLine = eddaDesc.lines.find(l => l[0] === 'sharing');
  assert.ok(eddaShareLine[1].includes('welcome guest'), 'Identifies food sharing is allowed');

  // Hal inspects Stranger
  const strangerTile = idx(S, hx + 2, hy);
  const strangerDesc = read(S, { inspect: strangerTile, person: hal });
  assert.equal(strangerDesc.title, 'Stranger');
  const strangerRelLine = strangerDesc.lines.find(l => l[0] === 'relation');
  assert.ok(strangerRelLine[1].includes('Stranger'), 'Identifies as Stranger');
  const strangerShareLine = strangerDesc.lines.find(l => l[0] === 'sharing');
  assert.ok(strangerShareLine[1].includes('theft'), 'Identifies taking food would be theft');
});
