import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DATA, T, makeRng, createSim, makeWorld, step, generateWorldChunk, getBiome
} from '../../src/sim.js';

test('M5: Procedural Macro-Geography & Biome Classification', () => {
  assert.strictEqual(typeof getBiome, 'function', 'getBiome function must be exported');

  // Test biome classification across climate spectrum
  const forest = getBiome(0.5, 0.7, 0.5); // elevation, moisture, temp
  const arid = getBiome(0.4, 0.1, 0.8);
  const marsh = getBiome(0.1, 0.9, 0.6);
  const tundra = getBiome(0.6, 0.4, 0.1);

  assert.equal(forest.id, 'forest');
  assert.equal(arid.id, 'arid');
  assert.equal(marsh.id, 'marsh');
  assert.equal(tundra.id, 'tundra');
});

test('M5: Dynamic Chunk Generation and Streaming Latency (<50ms)', () => {
  assert.strictEqual(typeof generateWorldChunk, 'function', 'generateWorldChunk function must exist');

  const seed = 501;
  const t0 = performance.now();
  const chunk = generateWorldChunk(seed, 0, 0);
  const duration = performance.now() - t0;

  assert.ok(chunk instanceof Uint8Array, 'Chunk returns typed array of tiles');
  assert.equal(chunk.length, 32 * 32, 'Chunk contains exactly 32x32 tiles');
  assert.ok(duration < 50, `Chunk generation took ${duration.toFixed(2)}ms (<50ms budget)`);

  // Verify determinism: re-generating same chunk yields identical tile bytes
  const chunkAgain = generateWorldChunk(seed, 0, 0);
  assert.deepEqual(chunk, chunkAgain, 'Same seed and coordinates yield identical chunk');
});

test('M5: River networks, hydraulic flow, and ford crossings', () => {
  const S = createSim(502);
  let fordCount = 0, streamCount = 0;
  for (let i = 0; i < S.tiles.length; i++) {
    if (S.tiles[i] === T.ford) fordCount++;
    if (S.tiles[i] === T.stream) streamCount++;
  }
  assert.ok(streamCount > 0, 'River stream tiles exist across the world');
  assert.ok(fordCount > 0, 'Ford crossing connects roads across the river');
});
