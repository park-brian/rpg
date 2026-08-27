const test = require('node:test');
const assert = require('node:assert/strict');
const {
  makeRng, Heap, fnv, hashArray, hash, dayOf, yearOf, doyOf, season, growing,
  createSim, makeWorld, step, DATA
} = require('../../src/game.js');

test('makeRng: deterministic pseudo-random sequence from seed', () => {
  const rng1 = makeRng(12345);
  const rng2 = makeRng(12345);
  for (let i = 0; i < 20; i++) {
    assert.strictEqual(rng1(), rng2(), `Mismatch at index ${i}`);
  }

  const rngInt = makeRng(999);
  for (let i = 0; i < 50; i++) {
    const val = rngInt.int(10);
    assert.ok(Number.isInteger(val));
    assert.ok(val >= 0 && val < 10);
  }

  const items = ['apple', 'banana', 'cherry', 'date'];
  const pickVal = rngInt.pick(items);
  assert.ok(items.includes(pickVal));
});

test('Heap: min-heap priority queue maintains (time, seq) order', () => {
  const h = new Heap();
  assert.strictEqual(h.size, 0);

  h.push(100, { id: 'a' });
  h.push(50, { id: 'b' });
  h.push(50, { id: 'c' }); // Same time, seq determines FIFO
  h.push(200, { id: 'd' });
  h.push(10, { id: 'e' });

  assert.strictEqual(h.size, 5);
  assert.strictEqual(h.peekTime(), 10);

  assert.deepStrictEqual(h.pop(), { id: 'e' });
  assert.strictEqual(h.peekTime(), 50);
  assert.deepStrictEqual(h.pop(), { id: 'b' });
  assert.deepStrictEqual(h.pop(), { id: 'c' });
  assert.deepStrictEqual(h.pop(), { id: 'a' });
  assert.deepStrictEqual(h.pop(), { id: 'd' });
  assert.strictEqual(h.size, 0);
});

test('Time conversions & Season mathematics', () => {
  // 1 day = 1440 min
  assert.strictEqual(dayOf(0), 0);
  assert.strictEqual(dayOf(1439), 0);
  assert.strictEqual(dayOf(1440), 1);
  assert.strictEqual(dayOf(2880), 2);

  // 1 year = 360 days
  const oneYearMin = 360 * 1440;
  assert.strictEqual(yearOf(0), 0);
  assert.strictEqual(yearOf(oneYearMin - 1), 0);
  assert.strictEqual(yearOf(oneYearMin), 1);

  // Day of year
  assert.strictEqual(doyOf(0), 0);
  assert.strictEqual(doyOf(1440 * 10), 10);
  assert.strictEqual(doyOf(1440 * 370), 10);

  // Season curve: winter (doy 0) -> 0, midsummer (doy 180) -> 1
  const winter = season(0);
  const midsummer = season(180 * 1440);
  assert.ok(Math.abs(winter - 0.0) < 0.001, `Winter expected ~0, got ${winter}`);
  assert.ok(Math.abs(midsummer - 1.0) < 0.001, `Midsummer expected ~1, got ${midsummer}`);
  assert.strictEqual(growing(0), false);
  assert.strictEqual(growing(180 * 1440), true);
});

test('Determinism: same seed yields identical simulation hash after 90 days', () => {
  const simA = makeWorld(77, false, { immortal: true }).S;
  const simB = makeWorld(77, false, { immortal: true }).S;

  assert.strictEqual(hash(simA), hash(simB));

  step(simA, simA.time + 90 * 1440);
  step(simB, simB.time + 90 * 1440);

  assert.strictEqual(hash(simA), hash(simB));
});

test('Throughput benchmark: simulation executes ≥ 40k events/sec', () => {
  const sim = makeWorld(7, false, { immortal: true }).S;
  step(sim, sim.time + 10 * 1440);
  const t0 = performance.now();
  const e0 = sim.events;
  step(sim, sim.time + 80 * 1440);
  const ms = performance.now() - t0;
  const ev = sim.events - e0;
  const eps = (ev / (ms / 1000)) | 0;

  assert.ok(eps >= 20000, `Expected high event throughput, got ${eps.toLocaleString()} events/s`);
});
