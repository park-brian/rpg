const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DATA, T, ACT, makeWorld, step, inject, read, held, count, addThing, setTile, idx, walkable, saveState, loadState, hash
} = require('../../src/game.js');

test('M8: Generational "Become" Intent and Perspective Switching', () => {
  const { S, player } = makeWorld(801);
  const heir = 0; // Hal

  assert.equal(S.pplanner[player], 1, 'Player has input planner');
  assert.equal(S.pplanner[heir], 0, 'Heir has heuristic planner');

  // Inject become intent
  inject(S, player, { k: 'become', target: heir });

  assert.equal(S.pplanner[heir], 1, 'Target entity now has input planner');
  assert.equal(S.pplanner[player], 0, 'Previous entity reverted to heuristic planner');
});

test('M8: Rule-Based Magic System (Reagent + Grimoire + Bodily Sacrifice)', () => {
  const { S, player } = makeWorld(802);

  // Give player grimoire (book) and herbal reagent
  const book = addThing(S, { stuff: 'grimoire', holder: player, holderKind: 1 });
  const herb = addThing(S, { stuff: 'herb', qty: 2, holder: player, holderKind: 1 });

  // Inflict wound as bodily sacrifice requirement
  S.pwounds[player * 6 + 2] = 0.2; // left arm sacrifice

  // Affordance for casting spell
  const acts = read(S, { acts: player, slot: book });
  const castAct = acts.find(a => a.act === 'cast');
  assert.ok(castAct, 'Holding grimoire affords casting ritual spells');

  // Cast ritual spell
  inject(S, player, { k: 'act', slot: book, act: 'cast' });
  step(S, S.time + DATA.ACT_MIN.cast + 1);

  // Check magic effect: wisdom/lore skill increases and regional fertility blessed
  assert.ok(S.pskills[player * 12 + 11] > 0, 'Lore/Magic skill increases with ritual practice');
});

test('M9: State Serialization, Deserialization, and Determinism Invariance', () => {
  const { S, player } = makeWorld(803);
  const YEAR = DATA.DAYS_PER_YEAR * 1440;

  // Run simulation for 2 years
  step(S, S.time + 2 * YEAR);

  // Serialize state to JSON string
  const snapshot = saveState(S);
  assert.ok(typeof snapshot === 'string', 'saveState returns JSON string');

  // Load into fresh simulation instance
  const restoredS = loadState(snapshot);
  assert.ok(restoredS, 'loadState successfully restores simulation');
  assert.equal(restoredS.time, S.time, 'Restored time matches original');
  assert.equal(restoredS.pn, S.pn, 'Restored entity count matches original');
  assert.equal(hash(restoredS), hash(S), 'State hash is identical after round-trip serialization');
});

test('M9: Spatial Grid (pgrid) Invariant across simulation and round-trip', () => {
  const { S } = makeWorld(804);
  const YEAR = DATA.DAYS_PER_YEAR * 1440;

  // Run simulation for 3 years
  step(S, S.time + 3 * YEAR);

  // Invariant 1: For every occupied tile in pgrid, the recorded occupant is alive and located at that tile
  for (let y = 0; y < S.H; y++) {
    for (let x = 0; x < S.W; x++) {
      const occ = S.pgrid[y * S.W + x];
      if (occ > 0) {
        const p = occ - 1;
        assert.equal(S.palive[p], 1, `Occupant person ${p} is alive`);
        assert.equal(S.px[p], x, `Occupant person ${p} x matches`);
        assert.equal(S.py[p], y, `Occupant person ${p} y matches`);
      }
    }
  }

  // Invariant 2: For every living person, their coordinate tile in pgrid has occupant > 0
  for (let p = 0; p < S.pn; p++) {
    if (S.palive[p]) {
      const occ = S.pgrid[S.py[p] * S.W + S.px[p]];
      assert.ok(occ > 0, `pgrid at (${S.px[p]}, ${S.py[p]}) has valid occupant`);
    }
  }

  // Invariant 3: Round-trip restore rebuilds valid spatial grid and walkability equivalence
  const snapshot = saveState(S);
  const restoredS = loadState(snapshot);
  for (let y = 0; y < restoredS.H; y++) {
    for (let x = 0; x < restoredS.W; x++) {
      const restoredOcc = restoredS.pgrid[y * restoredS.W + x];
      if (restoredOcc > 0) {
        const p = restoredOcc - 1;
        assert.equal(restoredS.palive[p], 1, `Restored occupant ${p} is alive`);
        assert.equal(restoredS.px[p], x, `Restored occupant ${p} x matches`);
        assert.equal(restoredS.py[p], y, `Restored occupant ${p} y matches`);
      }
      assert.equal(walkable(restoredS, x, y), walkable(S, x, y), `Walkability identical at (${x}, ${y})`);
    }
  }
});
