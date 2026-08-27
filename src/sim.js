'use strict';

// ============================================================================
// ==== 1. DATA TABLES & SIMULATION CONSTANTS ====
// ============================================================================
const DATA = {
  MIN_PER_DAY: 1440,
  DAYS_PER_YEAR: 360,
  WALK_MIN: 0.2, // Minutes per 2m tile walk

  NEEDS: ['food', 'sleep', 'warmth', 'safety', 'company'],
  SKILLS: [
    'farming', 'woodcutting', 'carpentry', 'smithing', 'masonry', 'tailoring',
    'foraging', 'cooking', 'trading', 'fighting', 'healing', 'lore'
  ],
  OCCUPATIONS: ['none', 'farmer', 'carpenter', 'smith', 'baker', 'tailor', 'trader'],
  BEASTS: ['human', 'wolf', 'deer', 'bear', 'boar'],
  BODY_REGIONS: ['head', 'torso', 'left_arm', 'right_arm', 'left_leg', 'right_leg'],

  // Decay per minute: food 2 days, sleep 16h awake, warmth 6h outdoors in cold, safety/company slow.
  NEED_DECAY: [100 / 2880, 100 / 960, 100 / 360, 100 / 7200, 100 / 4320],
  HOURS_PER_DAY: 10,
  ADULT_YEARS: 14,
  OLD_YEARS: 55,
  PAIR_REGARD: 55, // How well two people must regard each other to form a household
  FERTILE_YEARS: [16, 42],

  STUFF: {
    knife:      { name: 'knife',      kind: 'tool', tool: 'knife' },
    axe:        { name: 'axe',        kind: 'tool', tool: 'axe' },
    spade:      { name: 'spade',      kind: 'tool', tool: 'spade' },
    waterskin:  { name: 'waterskin',  kind: 'vessel' },
    bread:      { name: 'bread',      kind: 'food', food: 40 },
    grain:      { name: 'grain',      kind: 'food', food: 25, seed: true },
    berries:    { name: 'berries',    kind: 'food', food: 12 },
    flour:      { name: 'flour',      kind: 'food', food: 15 },
    dough:      { name: 'dough',      kind: 'food', food: 20 },
    roast_meat: { name: 'roast meat', kind: 'food', food: 60 },
    meat:       { name: 'meat',       kind: 'food', food: 30 },
    log:        { name: 'log',        kind: 'part' },
    firewood:   { name: 'firewood',   kind: 'part' },
    thatch:     { name: 'thatch',     kind: 'part' },
    penny:      { name: 'penny',      kind: 'coin' },
    ore:        { name: 'ore',        kind: 'part' },
    iron:       { name: 'iron',       kind: 'part' },
    cloth:      { name: 'cloth',      kind: 'part' },
    hide:       { name: 'hide',       kind: 'part' },
    bow:        { name: 'bow',        kind: 'tool', tool: 'bow' },
    grimoire:   { name: 'grimoire',   kind: 'tool', tool: 'grimoire' },
    herb:       { name: 'herb',       kind: 'food', food: 5 },
  },

  ACTS: [
    'idle', 'walk', 'sleep', 'eat', 'chop', 'forage', 'thatch', 'till', 'sow', 'harvest',
    'build', 'store', 'talk', 'whittle', 'take', 'enter', 'mill', 'bake', 'fence', 'smelt',
    'forge', 'hire', 'pay', 'attack', 'bandage', 'flee', 'cast', 'knead', 'roast', 'stoke'
  ],

  // Minutes of work per action
  ACT_MIN: {
    chop: 35, forage: 6, thatch: 5, till: 14, sow: 3, harvest: 8, build: 45,
    eat: 4, store: 1, talk: 1, whittle: 40, take: 0.5, enter: 1, inspect: 0.2,
    mill: 10, bake: 15, fence: 12, smelt: 40, forge: 50, hire: 5, pay: 1,
    attack: 2, bandage: 5, flee: 1, cast: 30, knead: 5, roast: 10, stoke: 2
  },

  RECIPE: {
    spade: { from: 'log', tool: 'knife', act: 'whittle', gives: 'spade' }
  },

  HUT: { log: 4, thatch: 4 },
  HUT_HOURS: 8,
  SHED: { log: 3, thatch: 3 },
  SHED_HOURS: 4,
  FENCE: { log: 1 },
  FENCE_HOURS: 0.2,

  CROP: { growDays: 120, yieldBase: 20 },

  TILE: {
    grass: 0, stream: 1, path: 2, tree: 3, tilled: 4, crop: 5, ripe: 6,
    hut: 7, frame: 8, ford: 9, fence: 10, shed: 11, well: 12, bridge: 13
  },

  TILE_COLOR: [
    '#6a9a4a', '#4a7ab0', '#b8a070', '#3d6b33', '#7a5a3a', '#8aa04a',
    '#c9a84a', '#8a6a48', '#9a8a6a', '#7fa0c0', '#7a6040', '#9a7a58',
    '#607080', '#8a8070'
  ],

  // Walkability: fields, ford, path, and grass are walkable
  TILE_WALK: [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],

  NAMES: [
    'Hal', 'Mara', 'Tam', 'Edda', 'Bran', 'Wyn', 'Osk', 'Ilse',
    'Rook', 'Fen', 'Gest', 'Sela', 'Orm', 'Ylva', 'Cade', 'Nena'
  ],

  VALUE: {
    grain: 1, berries: 1, flour: 2, dough: 3, bread: 4, log: 3, firewood: 1, thatch: 2,
    knife: 20, spade: 15, axe: 40, waterskin: 8, penny: 1,
    ore: 2, iron: 6, cloth: 5, meat: 5, roast_meat: 8, hide: 4, bow: 25
  }
};

const T = DATA.TILE;
const ACT = {};
DATA.ACTS.forEach((actName, index) => {
  ACT[actName] = index;
});

const DIRS = [[0, 1], [0, -1], [-1, 0], [1, 0]]; // South, North, West, East


// ============================================================================
// ==== 2. CORE MATHEMATICS, PRNG, HEAP & STATE HASHING ====
// ============================================================================

/**
 * Deterministic 32-bit xorshift PRNG
 */
function makeRng(seed) {
  let state = (seed >>> 0) || 1;
  const rng = () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
  rng.int = (max) => (rng() * max) | 0;
  rng.pick = (array) => array[rng.int(array.length)];
  return rng;
}

/**
 * Min-Heap Priority Queue on (time, seq)
 * Sequence counter guarantees total ordering and strict determinism.
 */
class Heap {
  constructor() {
    this.times = [];
    this.seqs = [];
    this.events = [];
    this.nextSeq = 0;
  }

  get size() {
    return this.times.length;
  }

  push(time, event) {
    const times = this.times;
    const seqs = this.seqs;
    const events = this.events;

    let index = times.length;
    times.push(time);
    seqs.push(this.nextSeq++);
    events.push(event);

    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      const parentTime = times[parentIndex];
      const currentTime = times[index];

      if (parentTime < currentTime || (parentTime === currentTime && seqs[parentIndex] < seqs[index])) {
        break;
      }

      // Swap parent and current
      [times[parentIndex], times[index]] = [times[index], times[parentIndex]];
      [seqs[parentIndex], seqs[index]] = [seqs[index], seqs[parentIndex]];
      [events[parentIndex], events[index]] = [events[index], events[parentIndex]];
      index = parentIndex;
    }
  }

  peekTime() {
    return this.times[0];
  }

  pop() {
    const times = this.times;
    const seqs = this.seqs;
    const events = this.events;
    const topEvent = events[0];
    const lastIndex = times.length - 1;

    times[0] = times[lastIndex];
    seqs[0] = seqs[lastIndex];
    events[0] = events[lastIndex];

    times.pop();
    seqs.pop();
    events.pop();

    let index = 0;
    const length = times.length;

    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = leftChild + 1;
      let smallest = index;

      if (leftChild < length && (times[leftChild] < times[smallest] || (times[leftChild] === times[smallest] && seqs[leftChild] < seqs[smallest]))) {
        smallest = leftChild;
      }
      if (rightChild < length && (times[rightChild] < times[smallest] || (times[rightChild] === times[smallest] && seqs[rightChild] < seqs[smallest]))) {
        smallest = rightChild;
      }

      if (smallest === index) break;

      [times[smallest], times[index]] = [times[index], times[smallest]];
      [seqs[smallest], seqs[index]] = [seqs[index], seqs[smallest]];
      [events[smallest], events[index]] = [events[index], events[smallest]];
      index = smallest;
    }

    return topEvent;
  }
}

/**
 * 32-bit FNV-1a Hash function
 */
function fnv(hashVal, num) {
  for (let k = 0; k < 4; k++) {
    hashVal ^= (num >>> (8 * k)) & 0xff;
    hashVal = Math.imul(hashVal, 16777619) >>> 0;
  }
  return hashVal;
}

function hashArray(hashVal, array) {
  const isFloat = array instanceof Float32Array;
  for (let i = 0; i < array.length; i++) {
    hashVal = fnv(hashVal, isFloat ? Math.round(array[i] * 1000) : array[i]);
  }
  return hashVal;
}

// Time mathematics
const dayOf = (time) => Math.floor(time / DATA.MIN_PER_DAY);
const yearOf = (time) => Math.floor(time / DATA.MIN_PER_DAY / DATA.DAYS_PER_YEAR);
const doyOf = (time) => dayOf(time) % DATA.DAYS_PER_YEAR;
const season = (time) => 0.5 - 0.5 * Math.cos((doyOf(time) / DATA.DAYS_PER_YEAR) * 2 * Math.PI);
const growing = (time) => season(time) > 0.35;


// ============================================================================
// ==== 3. STATE ALLOCATION, MEMORY (SoA) & DUAL-INDEXED STOCK ====
// ============================================================================

const MAXP = 1024;
const MAXT = 8192;
const MAX_PERSONS = MAXP;
const MAX_THINGS = MAXT;

/**
 * Creates and initializes a contiguous Struct-of-Arrays simulation instance
 */
function createSim(seed, opts = {}) {
  const rng = makeRng(seed);
  const sim = {
    seed,
    time: 75 * 1440 + 8 * 60, // Early spring at 08:00
    opts,
    immortal: !!opts.immortal,
    onMeet: null,
    onSleep: null,
    onDeath: null,
    onOpen: null,

    W: opts.w || 160,
    H: opts.h || 96,
    PW: 0,
    PH: 0,
    psoil: null,
    pcover: null,
    tiles: null,
    tstate: null,

    // Person Store (SoA)
    pn: 0,
    px: new Int16Array(MAX_PERSONS),
    py: new Int16Array(MAX_PERSONS),
    pface: new Int8Array(MAX_PERSONS),
    palive: new Uint8Array(MAX_PERSONS),
    pplanner: new Uint8Array(MAX_PERSONS),
    pbirth: new Float32Array(MAX_PERSONS),
    pneeds: new Float32Array(MAX_PERSONS * 5),
    phours: new Float32Array(MAX_PERSONS),
    pbusyUntil: new Float32Array(MAX_PERSONS),
    pplanSeq: new Uint32Array(MAX_PERSONS),
    pact: new Uint8Array(MAX_PERSONS),
    pactStart: new Float32Array(MAX_PERSONS),
    pskills: new Float32Array(MAX_PERSONS * 12),
    pocc: new Uint8Array(MAX_PERSONS),
    pkind: new Uint8Array(MAX_PERSONS), // 0: human, 1: wolf, 2: deer, 3: bear, 4: boar
    pwounds: new Float32Array(MAX_PERSONS * 6),
    pfollow: new Int32Array(MAX_PERSONS).fill(-1),
    ppartner: new Int32Array(MAX_PERSONS).fill(-1),
    pmother: new Int32Array(MAX_PERSONS).fill(-1),
    plastBirth: new Float32Array(MAX_PERSONS),
    phome: new Int32Array(MAX_PERSONS).fill(-1),
    pexposed: new Float32Array(MAX_PERSONS),
    pgoFrom: new Int32Array(MAX_PERSONS).fill(-1),
    pgoStart: new Float32Array(MAX_PERSONS),
    pgoEnd: new Float32Array(MAX_PERSONS),
    pheld: new Int8Array(MAX_PERSONS).fill(-1),
    pgrid: new Int16Array((opts.w || 160) * (opts.h || 96)),
    pname: [],
    pintent: [],
    regard: [],
    belief: [],
    households: [],
    debt: new Map(),
    board: [],

    // Thing Store (SoA with dual-indexed stock)
    stock: new Map(), // holderKey -> Map(stuff -> {qty, ids})
    tn: 0,
    tstuff: [],
    tqty: new Int32Array(MAX_THINGS),
    twear: new Float32Array(MAX_THINGS),
    tholder: new Int32Array(MAX_THINGS),
    tholderKind: new Uint8Array(MAX_THINGS), // 0: none, 1: person, 2: tile/site

    // World & Project state
    projects: new Map(), // tileIndex -> {type, log, thatch, work, reqHours, target}
    bad: new Set(),
    tileCount: new Int32Array(16),
    rain: [],
    trades: 0,
    tradeValue: 0,
    lastDeal: new Map(),
    recall: new Map(),
    journal: [],
    events: 0,
    hoursByAct: new Float32Array(16),
    deaths: { starved: 0, exposure: 0, age: 0, combat: 0 },
    hearths: new Map(), // homeTile -> { litUntil, firewood }
    penemy: new Int16Array(MAX_PERSONS).fill(-1),
    heap: new Heap(),
    rng
  };

  // Parcel allocation (32x32 tiles per macro-parcel)
  sim.PW = Math.ceil(sim.W / 32);
  sim.PH = Math.ceil(sim.H / 32);
  sim.psoil = new Float32Array(sim.PW * sim.PH);
  sim.pcover = new Float32Array(sim.PW * sim.PH);

  for (let i = 0; i < sim.PW * sim.PH; i++) {
    sim.psoil[i] = 0.6 + rng() * 0.6;
    sim.pcover[i] = rng() < 0.5 ? 0.02 + rng() * 0.06 : 0.12 + rng() * 0.25;
  }

  sim.tiles = new Uint8Array(sim.W * sim.H);
  sim.tstate = new Float32Array(sim.W * sim.H);
  const streamX = sim.W * 0.72;

  for (let y = 0; y < sim.H; y++) {
    for (let x = 0; x < sim.W; x++) {
      let tileType = T.grass;
      const parcelIndex = ((y >> 5) * sim.PW) + (x >> 5);
      const isRiver = Math.abs(x - (streamX + Math.sin(y * 0.15) * 3 | 0)) < 1.5;

      if (isRiver) {
        tileType = (y === (sim.H >> 1)) ? T.ford : T.stream;
      } else if (y === (sim.H >> 1)) {
        tileType = T.path;
      } else if (rng() < sim.pcover[parcelIndex]) {
        tileType = T.tree;
        sim.tstate[y * sim.W + x] = 20 + rng() * 60;
      }

      sim.tiles[y * sim.W + x] = tileType;
      sim.tileCount[tileType]++;
    }
  }

  ensureConnected(sim);

  for (let year = 0; year < 80; year++) {
    sim.rain[year] = (opts.drought && year >= 1 && year < 4) ? 0.25 : 0.55 + rng() * 0.75;
  }

  sim.season = season(sim.time);
  sim.heap.push(sim.time + 1440 - 240, { k: 'day' });
  sim.heap.push(sim.time + 1440 - 240, { k: 'land' });

  return sim;
}

const idx = (sim, x, y) => y * sim.W + x;

function setTile(sim, tileIndex, tileType) {
  sim.tileCount[sim.tiles[tileIndex]]--;
  sim.tiles[tileIndex] = tileType;
  sim.tileCount[tileType]++;
}

const tileAt = (sim, x, y) => (x < 0 || y < 0 || x >= sim.W || y >= sim.H) ? T.stream : sim.tiles[y * sim.W + x];

const walkable = (sim, x, y, personId) => {
  const t = tileAt(sim, x, y);
  if (DATA.TILE_WALK[t] !== 1) return false;
  if (t === T.hut) return true; // Multi-occupant shelter zone: families share cabin space
  const occ = personAt(sim, x, y);
  return !occ || (personId !== undefined && occ === personId + 1);
};

function getHearth(sim, homeTile) {
  if (homeTile < 0 || sim.tiles[homeTile] !== T.hut) return null;
  let h = sim.hearths.get(homeTile);
  if (!h) {
    h = { litUntil: sim.time + 1440, firewood: 4 };
    sim.hearths.set(homeTile, h);
  }
  return h;
}

function personAt(sim, x, y) {
  if (x < 0 || y < 0 || x >= sim.W || y >= sim.H) return 0;
  return sim.pgrid ? sim.pgrid[y * sim.W + x] : 0;
}

function clearSpatialOccupant(sim, personId, x, y) {
  if (!sim.pgrid) return;
  const tileIndex = y * sim.W + x;
  if (sim.pgrid[tileIndex] === personId + 1) {
    let replacement = 0;
    for (let p = 0; p < sim.pn; p++) {
      if (p !== personId && sim.palive[p] && sim.px[p] === x && sim.py[p] === y) {
        replacement = p + 1;
        break;
      }
    }
    sim.pgrid[tileIndex] = replacement;
  }
}

const ageYears = (sim, personId) => (sim.time - sim.pbirth[personId]) / 1440 / DATA.DAYS_PER_YEAR;

/**
 * 0-1 BFS ensuring every walkable tile is reachable from the main road
 */
function ensureConnected(sim) {
  const W = sim.W;
  const H = sim.H;
  const totalTiles = W * H;
  const dist = new Int32Array(totalTiles).fill(-1);
  const parent = new Int32Array(totalTiles).fill(-1);
  const queue = [];

  for (let x = 0; x < W; x++) {
    const roadTile = idx(sim, x, H >> 1);
    if (DATA.TILE_WALK[sim.tiles[roadTile]] === 1) {
      dist[roadTile] = 0;
      queue.push(roadTile);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    const cx = current % W;
    const cy = (current / W) | 0;

    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;

      const neighborIndex = nx + ny * W;
      const neighborTile = sim.tiles[neighborIndex];
      if (neighborTile === T.stream) continue;

      const weight = neighborTile === T.tree ? 1 : 0;
      const newDist = dist[current] + weight;

      if (dist[neighborIndex] < 0 || newDist < dist[neighborIndex]) {
        dist[neighborIndex] = newDist;
        parent[neighborIndex] = current;
        if (weight) queue.push(neighborIndex);
        else queue.splice(head, 0, neighborIndex);
      }
    }
  }

  for (let i = 0; i < totalTiles; i++) {
    if (DATA.TILE_WALK[sim.tiles[i]] === 1 && dist[i] > 0) {
      let cur = i;
      while (cur >= 0 && dist[cur] > 0) {
        if (sim.tiles[cur] === T.tree) {
          sim.tileCount[T.tree]--;
          sim.tiles[cur] = T.grass;
          sim.tileCount[T.grass]++;
          sim.tstate[cur] = 0;
        }
        cur = parent[cur];
      }
    }
  }
}

function addPerson(sim, { name, x, y, planner = 0, age = 25, home = -1, kind = 0 }) {
  const personId = sim.pn++;
  sim.px[personId] = x;
  sim.py[personId] = y;
  sim.pface[personId] = 0;
  sim.palive[personId] = 1;
  if (sim.pgrid) sim.pgrid[y * sim.W + x] = personId + 1;
  sim.pplanner[personId] = planner;
  sim.pbirth[personId] = sim.time - age * DATA.DAYS_PER_YEAR * 1440;

  for (let k = 0; k < 5; k++) {
    sim.pneeds[personId * 5 + k] = 60 + sim.rng.int(30);
  }

  sim.phours[personId] = DATA.HOURS_PER_DAY;
  sim.pbusyUntil[personId] = 0;
  sim.pname[personId] = name || DATA.BEASTS[kind] || ('Creature' + personId);
  sim.pkind[personId] = kind;
  sim.pintent[personId] = [];
  sim.phome[personId] = home;
  sim.pgoFrom[personId] = -1;
  sim.regard[personId] = {};
  sim.belief[personId] = Object.assign({}, DATA.VALUE);

  for (const kin of household(sim, home)) {
    if (kin !== personId) {
      sim.regard[personId][kin] = 40;
      sim.regard[kin][personId] = 40;
    }
  }

  sim.heap.push(sim.time, { k: 'needs', a: personId });
  sim.heap.push(sim.time + 0.01, { k: 'plan', a: personId, seq: 0 });
  return personId;
}

// Dual-Indexed Stock Container Methods (O(1) lookups)
const stockKey = (holderKind, holderId) => holderKind * 0x40000000 + holderId;

function stockOf(sim, holderKind, holderId) {
  const key = stockKey(holderKind, holderId);
  let stockMap = sim.stock.get(key);
  if (!stockMap) {
    stockMap = new Map();
    sim.stock.set(key, stockMap);
  }
  return stockMap;
}

function stockAdd(sim, thingId, deltaQty) {
  if (!deltaQty) return;
  const stockMap = stockOf(sim, sim.tholderKind[thingId], sim.tholder[thingId]);
  const stuff = sim.tstuff[thingId];
  let entry = stockMap.get(stuff);

  if (!entry) {
    entry = { qty: 0, ids: [] };
    stockMap.set(stuff, entry);
  }

  entry.qty += deltaQty;
  if (deltaQty > 0) {
    if (!entry.ids.includes(thingId)) entry.ids.push(thingId);
  } else if (sim.tqty[thingId] <= 0) {
    const idxInIds = entry.ids.indexOf(thingId);
    if (idxInIds >= 0) entry.ids.splice(idxInIds, 1);
  }

  if (entry.qty <= 0 && !entry.ids.length) {
    stockMap.delete(stuff);
  }
}

function setQty(sim, thingId, newQty) {
  const delta = newQty - sim.tqty[thingId];
  sim.tqty[thingId] = newQty;
  stockAdd(sim, thingId, delta);
}

function setHolder(sim, thingId, newHolderKind, newHolderId) {
  stockAdd(sim, thingId, -sim.tqty[thingId]);
  sim.tholderKind[thingId] = newHolderKind;
  sim.tholder[thingId] = newHolderId;
  stockAdd(sim, thingId, sim.tqty[thingId]);
}

function addThing(sim, { stuff, qty = 1, holder = -1, holderKind = 0 }) {
  if (!DATA.STUFF[stuff].tool) {
    const entry = stockOf(sim, holderKind, holder).get(stuff);
    if (entry && entry.ids.length) {
      setQty(sim, entry.ids[0], sim.tqty[entry.ids[0]] + qty);
      return entry.ids[0];
    }
  }

  let freeIndex = -1;
  for (let i = 0; i < sim.tn; i++) {
    if (sim.tqty[i] <= 0) {
      freeIndex = i;
      break;
    }
  }

  const thingId = freeIndex >= 0 ? freeIndex : sim.tn++;
  if (thingId >= MAX_THINGS) throw new Error('Thing capacity limit reached');

  sim.tstuff[thingId] = stuff;
  sim.tqty[thingId] = 0;
  sim.twear[thingId] = 0;
  sim.tholderKind[thingId] = holderKind;
  sim.tholder[thingId] = holder;
  setQty(sim, thingId, qty);
  return thingId;
}

function held(sim, holderKind, holderId, stuffOrKind) {
  const stockMap = sim.stock.get(stockKey(holderKind, holderId));
  if (!stockMap) return -1;

  const directEntry = stockMap.get(stuffOrKind);
  if (directEntry && directEntry.ids.length) return directEntry.ids[0];

  for (const [stuffName, entry] of stockMap) {
    if (!entry.ids.length) continue;
    const def = DATA.STUFF[stuffName];
    if (def.kind === stuffOrKind || def.tool === stuffOrKind) return entry.ids[0];
  }
  return -1;
}

function hands(sim, personId) {
  const stockMap = sim.stock.get(stockKey(1, personId));
  if (!stockMap) return [];
  const heldIds = [];
  for (const entry of stockMap.values()) {
    for (const thingId of entry.ids) {
      if (sim.tqty[thingId] > 0) heldIds.push(thingId);
    }
  }
  return heldIds.sort((a, b) => a - b);
}

function count(sim, holderKind, holderId, stuffName) {
  const stockMap = sim.stock.get(stockKey(holderKind, holderId));
  const entry = stockMap && stockMap.get(stuffName);
  return entry ? entry.qty : 0;
}

function moveThing(sim, thingId, targetHolderId, targetHolderKind, qty) {
  const actualQty = Math.min(qty || sim.tqty[thingId], sim.tqty[thingId]);
  if (actualQty <= 0) return -1;
  setQty(sim, thingId, sim.tqty[thingId] - actualQty);
  return addThing(sim, { stuff: sim.tstuff[thingId], qty: actualQty, holder: targetHolderId, holderKind: targetHolderKind });
}

function journal(sim, text) {
  sim.journal.push({ t: sim.time, text });
  if (sim.journal.length > 800) sim.journal.splice(0, 200);
}

function gainSkill(sim, personId, skillId, amount = 0.05) {
  sim.pskills[personId * 12 + skillId] = Math.min(100, sim.pskills[personId * 12 + skillId] + amount);
}

function wearTool(sim, thingId, amount = 0.02) {
  if (thingId >= 0 && sim.twear[thingId] < 1.0) {
    sim.twear[thingId] = Math.min(1.0, sim.twear[thingId] + amount);
  }
}

function regardShift(sim, fromPerson, toPerson, delta) {
  if (fromPerson === toPerson) return;
  const personRegard = sim.regard[fromPerson] || (sim.regard[fromPerson] = {});
  personRegard[toPerson] = Math.max(-100, Math.min(100, (personRegard[toPerson] ?? 0) + delta));
}

const regardOf = (sim, fromPerson, toPerson) => (sim.regard[fromPerson] && sim.regard[fromPerson][toPerson]) ?? 0;

function sawPrice(sim, personId, stuffName, price) {
  const beliefs = sim.belief[personId];
  beliefs[stuffName] = beliefs[stuffName] === undefined ? price : beliefs[stuffName] * 0.7 + price * 0.3;
}

function worthTo(sim, personId, stuffName) {
  const baseValue = sim.belief[personId][stuffName] ?? 1;
  const def = DATA.STUFF[stuffName];

  if (def.kind === 'food') {
    const hungerFactor = Math.max(0, 60 - sim.pneeds[personId * 5]) / 60;
    const storeQty = sim.phome[personId] >= 0 ? count(sim, 2, sim.phome[personId], stuffName) : 0;
    const abundanceMultiplier = storeQty > 600 ? 0.4 : storeQty > 200 ? 0.8 : 2.0;
    return baseValue * (1 + hungerFactor) * abundanceMultiplier;
  }
  if (def.tool) {
    return baseValue * (held(sim, 1, personId, def.tool) >= 0 ? 0.4 : 1.6);
  }
  return baseValue;
}

const dealKey = (a, b) => Math.min(a, b) * 4096 + Math.max(a, b);

function tradeOffer(sim, sellerId, buyerId, stuffName, quantity) {
  if (sellerId === buyerId) return { stuff: stuffName, qty: quantity, ask: 0, bid: 0, coin: 0, ok: false };
  const lastDealTime = sim.lastDeal.get(dealKey(sellerId, buyerId));
  if (lastDealTime !== undefined && sim.time - lastDealTime < 10 * 1440) {
    return { stuff: stuffName, qty: quantity, ask: 0, bid: 0, coin: 0, ok: false };
  }
  const sellerWorth = worthTo(sim, sellerId, stuffName);
  const buyerWorth = worthTo(sim, buyerId, stuffName);
  const ask = Math.max(1, Math.round(sellerWorth * quantity));
  const bid = Math.max(1, Math.round(buyerWorth * quantity));
  const buyerPennies = count(sim, 1, buyerId, 'penny');
  const agreedPrice = Math.min(buyerPennies, Math.max(1, Math.round((ask + bid) / 2)));
  return { stuff: stuffName, qty: quantity, ask: agreedPrice, bid, coin: buyerPennies, ok: buyerPennies >= 1 && buyerPennies >= agreedPrice };
}

function doTrade(sim, sellerId, buyerId, stuffName, quantity, price) {
  const sellerThing = held(sim, 1, sellerId, stuffName);
  if (sellerThing < 0 || sim.tqty[sellerThing] < quantity) return false;

  const buyerCoin = held(sim, 1, buyerId, 'penny');
  if (buyerCoin < 0 || sim.tqty[buyerCoin] < price) return false;

  moveThing(sim, sellerThing, buyerId, 1, quantity);
  moveThing(sim, buyerCoin, sellerId, 1, price);

  sawPrice(sim, sellerId, stuffName, price / quantity);
  sawPrice(sim, buyerId, stuffName, price / quantity);

  regardShift(sim, sellerId, buyerId, 4);
  regardShift(sim, buyerId, sellerId, 4);

  sim.lastDeal.set(dealKey(sellerId, buyerId), sim.time);
  sim.trades++;
  sim.tradeValue += price;

  journal(sim, `${sim.pname[buyerId]} bought ${quantity} ${stuffName} from ${sim.pname[sellerId]} for ${price} pennies.`);
  return true;
}


// ============================================================================
// ==== 4. SPATIAL SEARCH & PATHFINDING (BFS) ====
// ============================================================================

function pathLen(sim, startX, startY, targetX, targetY) {
  if (startX === targetX && startY === targetY) return 0;
  const W = sim.W;
  const H = sim.H;

  if (!sim.seenBuffer) sim.seenBuffer = new Int32Array(W * H);
  const seen = sim.seenBuffer;
  sim.seenStamp = (sim.seenStamp || 0) + 1;
  const stamp = sim.seenStamp;

  let queue = [startX + startY * W];
  seen[startX + startY * W] = stamp;
  let distance = 0;
  let visitedCount = 0;

  while (queue.length && distance < 600 && visitedCount < 40000) {
    distance++;
    const nextQueue = [];
    for (const tileIdx of queue) {
      visitedCount++;
      const cx = tileIdx % W;
      const cy = (tileIdx / W) | 0;

      for (const [dx, dy] of DIRS) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;

        const neighborIdx = nx + ny * W;
        if (seen[neighborIdx] === stamp) continue;
        seen[neighborIdx] = stamp;

        if (nx === targetX && ny === targetY) return distance;
        if (DATA.TILE_WALK[sim.tiles[neighborIdx]] !== 1) continue;

        nextQueue.push(neighborIdx);
      }
    }
    queue = nextQueue;
  }
  return -1;
}

function adjacentFree(sim, targetX, targetY, fromX, fromY) {
  let bestTile = -1;
  let bestDist = 1e9;

  for (const [dx, dy] of DIRS) {
    const nx = targetX + dx;
    const ny = targetY + dy;
    if (!walkable(sim, nx, ny)) continue;

    const dist = Math.abs(nx - fromX) + Math.abs(ny - fromY);
    if (dist < bestDist) {
      bestDist = dist;
      bestTile = idx(sim, nx, ny);
    }
  }
  return bestTile;
}

function nearestTile(sim, personId, predicate, maxRadius = 28, memoKey) {
  if (memoKey !== undefined) {
    const key = personId * 8 + memoKey;
    const previousFound = sim.recall.get(key);
    if (previousFound !== undefined && !sim.bad.has(previousFound) && predicate(previousFound % sim.W, (previousFound / sim.W) | 0, previousFound)) {
      return previousFound;
    }
    const found = nearestScan(sim, personId, predicate, maxRadius);
    if (found >= 0) sim.recall.set(key, found);
    else sim.recall.delete(key);
    return found;
  }
  return nearestScan(sim, personId, predicate, maxRadius);
}

function nearestScan(sim, personId, predicate, maxRadius = 28) {
  const home = sim.phome[personId];
  const centerX = home >= 0 ? home % sim.W : sim.px[personId];
  const centerY = home >= 0 ? ((home / sim.W) | 0) : sim.py[personId];

  for (let r = 1; r <= maxRadius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      const dx = r - Math.abs(dy);
      for (const sx of (dx ? [-dx, dx] : [0])) {
        const x = centerX + sx;
        const y = centerY + dy;
        if (x < 0 || y < 0 || x >= sim.W || y >= sim.H) continue;

        const tileIndex = idx(sim, x, y);
        if (sim.bad.has(tileIndex)) continue;

        if (predicate(x, y, tileIndex)) {
          const isAdjacent = Math.abs(sim.px[personId] - x) + Math.abs(sim.py[personId] - y) === 1;
          if (isAdjacent || adjacentFree(sim, x, y, centerX, centerY) >= 0) {
            return tileIndex;
          }
        }
      }
    }
  }
  return -1;
}

function countTiles(sim, cx, cy, radius, predicate) {
  let count = 0;
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      if (x < 0 || y < 0 || x >= sim.W || y >= sim.H) continue;
      if (predicate(idx(sim, x, y))) count++;
    }
  }
  return count;
}

function household(sim, homeTile) {
  const members = [];
  for (let i = 0; i < sim.pn; i++) {
    if (sim.palive[i] && sim.phome[i] === homeTile) members.push(i);
  }
  return members;
}

function findClaim(sim, nearX, nearY) {
  let bestTile = -1;
  let bestScore = -1;

  for (let r = 8; r < 44; r += 2) {
    for (let a = 0; a < 12; a++) {
      const theta = (a / 12) * Math.PI * 2;
      const x = Math.round(nearX + Math.cos(theta) * r);
      const y = Math.round(nearY + Math.sin(theta) * r);

      if (x < 4 || y < 4 || x >= sim.W - 4 || y >= sim.H - 4) continue;
      const tileIndex = idx(sim, x, y);
      if (sim.tiles[tileIndex] !== T.grass) continue;

      const tooClose = sim.households.some(h => {
        const hx = h.home % sim.W;
        const hy = (h.home / sim.W) | 0;
        return Math.abs(hx - x) + Math.abs(hy - y) < 20;
      });
      if (tooClose) continue;

      let openGrass = 0;
      let woodTiles = 0;
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const j = idx(sim, x + dx, y + dy);
          if (sim.tiles[j] === T.grass) openGrass++;
          if (sim.tiles[j] === T.tree) woodTiles++;
        }
      }

      const parcelIdx = ((y >> 5) * sim.PW) + (x >> 5);
      const score = sim.psoil[parcelIdx] * 10 + openGrass * 0.5 + Math.min(woodTiles, 8) - r * 0.12;
      if (score > bestScore) {
        bestScore = score;
        bestTile = tileIndex;
      }
    }
  }
  return bestTile;
}

function hasLineOfSight(sim, x0, y0, x1, y1, maxRadius = 12) {
  if (x0 === x1 && y0 === y1) return true;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const distSq = dx * dx + dy * dy;
  if (distSq > maxRadius * maxRadius) return false;

  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  for (let s = 1; s < steps; s++) {
    const cx = Math.round(x0 + (dx * s) / steps);
    const cy = Math.round(y0 + (dy * s) / steps);
    if (cx < 0 || cy < 0 || cx >= sim.W || cy >= sim.H) return false;
    const tile = sim.tiles[cy * sim.W + cx];
    if (tile === T.hut || tile === T.shed || tile === T.tree) {
      return false;
    }
  }
  return true;
}

function getKinshipRelation(sim, personA, personB) {
  if (personA < 0 || personB < 0 || personA === personB) return 'Self';
  if (sim.ppartner[personA] === personB || sim.ppartner[personB] === personA) return 'Spouse';
  if (sim.pmother[personA] === personB) return 'Mother';
  if (sim.pmother[personB] === personA) return 'Child';
  if (sim.pmother[personA] >= 0 && sim.pmother[personA] === sim.pmother[personB]) return 'Sibling';
  if (sim.phome[personA] >= 0 && sim.phome[personA] === sim.phome[personB]) return 'Kin';
  return null;
}

function checkAccessPermission(sim, personId, targetTile, stuffName) {
  let ownerHome = -1;
  const tileType = sim.tiles[targetTile];
  if (tileType === T.hut || tileType === T.shed) {
    ownerHome = targetTile;
  } else {
    for (let h = 0; h < sim.households.length; h++) {
      const hh = sim.households[h];
      const hx = hh.home % sim.W;
      const hy = (hh.home / sim.W) | 0;
      const tx = targetTile % sim.W;
      const ty = (targetTile / sim.W) | 0;
      if (Math.abs(hx - tx) <= 3 && Math.abs(hy - ty) <= 3) {
        ownerHome = hh.home;
        break;
      }
    }
  }

  if (ownerHome < 0) return { isTheft: false, isAllowed: true };

  const owners = household(sim, ownerHome);
  if (owners.length === 0) return { isTheft: false, isAllowed: true };

  // 1. Domestic household member
  if (sim.phome[personId] === ownerHome) {
    return { isTheft: false, isAllowed: true, reason: 'family', owners };
  }

  // 2. Trusted friend / allied guest (regard >= 30)
  let maxFriendRegard = -100;
  for (const o of owners) {
    const r = regardOf(sim, o, personId);
    if (r > maxFriendRegard) maxFriendRegard = r;
  }

  if (maxFriendRegard >= 30) {
    return { isTheft: false, isAllowed: true, isFriend: true, friendRegard: maxFriendRegard, owners };
  }

  // 3. Unauthorized taking (Theft) -> Sensory Perception Check
  const tx = targetTile % sim.W;
  const ty = (targetTile / sim.W) | 0;
  const hour = (sim.time % 1440) / 60;
  const isNight = hour < 5.5 || hour > 20.5;
  const maxVisionRadius = isNight ? 5 : 12;

  const witnesses = [];
  for (let p = 0; p < sim.pn; p++) {
    if (!sim.palive[p] || p === personId || sim.pkind[p] > 0) continue;
    const px = sim.px[p];
    const py = sim.py[p];
    const isSameTile = px === tx && py === ty;
    const isOwner = owners.includes(p);

    const isSleeping = sim.pneeds[p * 5 + 1] < 20 || (isSameTile && (hour >= 21 || hour < 5));
    if (isSleeping) {
      if (isSameTile) {
        const wakeChance = isOwner ? 0.4 : 0.2;
        if (sim.rng && sim.rng() < wakeChance) {
          witnesses.push(p);
        }
      }
      continue;
    }

    if (isSameTile) {
      witnesses.push(p);
    } else if (hasLineOfSight(sim, px, py, tx, ty, maxVisionRadius)) {
      witnesses.push(p);
    }
  }

  return {
    isTheft: true,
    isAllowed: false,
    witnessed: witnesses.length > 0,
    witnesses,
    owners
  };
}


// ============================================================================
// ==== 5. MODULAR UTILITY AI DECISION PLANNER ====
// ============================================================================


function plan(sim, personId) {
  if (sim.pplanner[personId] === 1) {
    return sim.pintent[personId].shift() || (sim.pheld[personId] >= 0 ? { k: 'move', d: sim.pheld[personId] } : null);
  }
  return heuristic(sim, personId);
}

function goAct(sim, personId, tileIndex, actName, slot) {
  const tx = tileIndex % sim.W;
  const ty = (tileIndex / sim.W) | 0;
  if (Math.abs(sim.px[personId] - tx) + Math.abs(sim.py[personId] - ty) === 1) {
    return { k: 'act', slot, target: tileIndex, act: actName };
  }
  return { k: 'go', to: adjacentFree(sim, tx, ty, sim.px[personId], sim.py[personId]), for: tileIndex };
}

function evalCombatResponse(sim, personId) {
  let enemy = sim.penemy ? sim.penemy[personId] : -1;
  if (enemy >= 0 && (!sim.palive[enemy] || enemy === personId)) {
    if (sim.penemy) sim.penemy[personId] = -1;
    enemy = -1;
  }

  if (enemy < 0) {
    for (let p = 0; p < sim.pn; p++) {
      if (!sim.palive[p] || p === personId) continue;
      if (regardOf(sim, personId, p) <= -30) {
        const d = Math.abs(sim.px[personId] - sim.px[p]) + Math.abs(sim.py[personId] - sim.py[p]);
        if (d <= 8 && hasLineOfSight(sim, sim.px[personId], sim.py[personId], sim.px[p], sim.py[p], 8)) {
          enemy = p;
          if (sim.penemy) sim.penemy[personId] = p;
          break;
        }
      }
    }
  }

  if (enemy >= 0) {
    const ex = sim.px[enemy];
    const ey = sim.py[enemy];
    const dist = Math.abs(sim.px[personId] - ex) + Math.abs(sim.py[personId] - ey);

    if (dist > 15) {
      if (sim.penemy) sim.penemy[personId] = -1;
      return null;
    }

    const isChild = ageYears(sim, personId) < DATA.ADULT_YEARS;
    let totalWounds = 0;
    for (let r = 0; r < 6; r++) totalWounds += sim.pwounds[personId * 6 + r];
    if (isChild || totalWounds > 0.6) {
      const ddx = sim.px[personId] - ex;
      const ddy = sim.py[personId] - ey;
      let fleeDir = 0;
      if (Math.abs(ddx) > Math.abs(ddy)) fleeDir = ddx > 0 ? 1 : 3;
      else fleeDir = ddy > 0 ? 2 : 0;
      return { k: 'move', d: fleeDir };
    }

    const axe = held(sim, 1, personId, 'axe');
    const knife = held(sim, 1, personId, 'knife');
    const bow = held(sim, 1, personId, 'bow');
    const spade = held(sim, 1, personId, 'spade');
    const weaponSlot = axe >= 0 ? axe : knife >= 0 ? knife : bow >= 0 ? bow : spade >= 0 ? spade : -1;

    if (dist <= 1) {
      return { k: 'act', slot: weaponSlot, target: idx(sim, ex, ey), act: 'attack' };
    } else {
      return { k: 'go', to: adjacentFree(sim, ex, ey, sim.px[personId], sim.py[personId]), for: idx(sim, ex, ey) };
    }
  }
  return null;
}

function evalNutrition(sim, personId) {
  const food = sim.pneeds[personId * 5];
  const thirst = sim.pneeds[personId * 5 + 3];

  // 1. Thirst hydration
  if (thirst < 40) {
    const skin = held(sim, 1, personId, 'waterskin');
    if (skin >= 0) return { k: 'act', slot: skin, act: 'drink' };
    const waterSource = nearestTile(sim, personId, (x, y, i) => sim.tiles[i] === T.stream || sim.tiles[i] === T.ford || sim.tiles[i] === T.well, 20);
    if (waterSource >= 0) {
      return goAct(sim, personId, waterSource, 'drink', -1);
    }
  }

  // 2. Hunger
  if (food >= 45) return null;
  const foodInHand = held(sim, 1, personId, 'bread') >= 0 ? held(sim, 1, personId, 'bread') :
                     held(sim, 1, personId, 'roast_meat') >= 0 ? held(sim, 1, personId, 'roast_meat') :
                     held(sim, 1, personId, 'berries') >= 0 ? held(sim, 1, personId, 'berries') :
                     held(sim, 1, personId, 'food');
  if (foodInHand >= 0) return { k: 'act', slot: foodInHand, act: 'eat' };

  const home = sim.phome[personId];
  if (home >= 0) {
    const isAtHome = Math.abs(sim.px[personId] - home % sim.W) + Math.abs(sim.py[personId] - ((home / sim.W) | 0)) <= 1;
    const foodInStore = held(sim, 2, home, 'bread') >= 0 ? held(sim, 2, home, 'bread') :
                        held(sim, 2, home, 'roast_meat') >= 0 ? held(sim, 2, home, 'roast_meat') :
                        held(sim, 2, home, 'berries') >= 0 ? held(sim, 2, home, 'berries') :
                        held(sim, 2, home, 'food');
    if (foodInStore >= 0) {
      return isAtHome
        ? { k: 'take', t: foodInStore, qty: 1 }
        : { k: 'go', to: adjacentFree(sim, home % sim.W, (home / sim.W) | 0, sim.px[personId], sim.py[personId]) };
    }
  }

  // 3. Friend Cabin Hospitality Sharing
  if (food < 45) {
    for (let h = 0; h < sim.households.length; h++) {
      const hh = sim.households[h];
      if (hh.home === home || sim.tiles[hh.home] !== T.hut) continue;
      const hx = hh.home % sim.W;
      const hy = (hh.home / sim.W) | 0;
      const dist = Math.abs(sim.px[personId] - hx) + Math.abs(sim.py[personId] - hy);
      if (dist <= 18) {
        const owners = household(sim, hh.home);
        const isFriendly = owners.some(o => regardOf(sim, o, personId) >= 30);
        if (isFriendly) {
          const friendFood = held(sim, 2, hh.home, 'bread') >= 0 ? held(sim, 2, hh.home, 'bread') :
                            held(sim, 2, hh.home, 'roast_meat') >= 0 ? held(sim, 2, hh.home, 'roast_meat') :
                            held(sim, 2, hh.home, 'berries') >= 0 ? held(sim, 2, hh.home, 'berries') : -1;
          if (friendFood >= 0) {
            const isAtFriendHome = dist <= 1;
            return isAtFriendHome
              ? { k: 'take', t: friendFood, qty: 1 }
              : { k: 'go', to: adjacentFree(sim, hx, hy, sim.px[personId], sim.py[personId]) };
          }
        }
      }
    }
  }
  return null;
}

function evalSleepAndWarmth(sim, personId) {
  const sleep = sim.pneeds[personId * 5 + 1];
  const warmth = sim.pneeds[personId * 5 + 2];
  const home = sim.phome[personId];
  const hasHut = home >= 0 && sim.tiles[home] === T.hut;
  const currentTile = idx(sim, sim.px[personId], sim.py[personId]);
  const isInsideCabin = currentTile === home;
  const hourOfDay = (sim.time % 1440) / 60;

  // 1. Critical Hypothermia or Night Sleep
  if (sleep < 25 || hourOfDay >= 20.5 || hourOfDay < 5.5 || (warmth < 40 && hasHut)) {
    if (hasHut && !isInsideCabin) return { k: 'go', to: home };
    if (hasHut && isInsideCabin) {
      const hearth = getHearth(sim, home);
      if (hearth && hearth.litUntil <= sim.time) {
        const logInHand = held(sim, 1, personId, 'log');
        if (logInHand >= 0) return { k: 'act', slot: logInHand, act: 'stoke' };
        const logInStore = held(sim, 2, home, 'log');
        if (logInStore >= 0) return { k: 'take', t: logInStore, qty: 1 };
      }
      return { k: 'sleep' };
    }
    return { k: 'sleep' };
  }

  // 2. Dusk Evening Retreat (18:00 - 20:30)
  if (hourOfDay >= 18.0 && hourOfDay < 20.5 && hasHut && !isInsideCabin) {
    return { k: 'go', to: home };
  }

  if (sim.phours[personId] <= 0) {
    if (hasHut && !isInsideCabin) return { k: 'go', to: home };
    return { k: 'wait', min: 60, act: ACT.idle };
  }
  return null;
}

function evalBeastInstinct(sim, personId) {
  if (sim.pkind[personId] === 0) return null;
  const kind = sim.pkind[personId];
  if (kind === 2) { // Deer: graze
    return { k: 'move', d: sim.rng.int(4) };
  } else if (kind === 1 || kind === 3) { // Wolf / Bear: hunt
    let prey = -1;
    let closestDist = 6;
    for (let q = 0; q < sim.pn; q++) {
      if (sim.palive[q] && q !== personId && (sim.pkind[q] === 0 || sim.pkind[q] === 2)) {
        const dist = Math.abs(sim.px[q] - sim.px[personId]) + Math.abs(sim.py[q] - sim.py[personId]);
        if (dist < closestDist) {
          closestDist = dist;
          prey = q;
        }
      }
    }
    if (prey >= 0) {
      const near = Math.abs(sim.px[prey] - sim.px[personId]) + Math.abs(sim.py[prey] - sim.py[personId]);
      return near <= 1
        ? { k: 'act', slot: -1, target: idx(sim, sim.px[prey], sim.py[prey]), act: 'attack' }
        : { k: 'go', to: adjacentFree(sim, sim.px[prey], sim.py[prey], sim.px[personId], sim.py[personId]), for: idx(sim, sim.px[prey], sim.py[prey]) };
    }
    return { k: 'move', d: sim.rng.int(4) };
  }
  return null;
}

function evalPartyFollow(sim, personId) {
  if (sim.pfollow[personId] >= 0 && sim.palive[sim.pfollow[personId]]) {
    const leader = sim.pfollow[personId];
    const dist = Math.abs(sim.px[leader] - sim.px[personId]) + Math.abs(sim.py[leader] - sim.py[personId]);
    if (dist > 1) {
      return { k: 'go', to: adjacentFree(sim, sim.px[leader], sim.py[leader], sim.px[personId], sim.py[personId]) };
    }
  }
  return null;
}

function evalChildWait(sim, personId) {
  if (ageYears(sim, personId) < DATA.ADULT_YEARS) {
    return { k: 'wait', min: 30 + sim.rng.int(60), act: ACT.idle };
  }
  return null;
}

function evalSurplusStorage(sim, personId, home, homeX, homeY, hasHut) {
  if (hasHut && count(sim, 2, home, 'grain') > 2000) {
    let shedNearby = false;
    for (let dy = -5; dy <= 5; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        const ti = idx(sim, homeX + dx, homeY + dy);
        if (sim.tiles[ti] === T.shed || (sim.projects.has(ti) && sim.projects.get(ti).type === 'shed')) {
          shedNearby = true;
          break;
        }
      }
    }
    if (!shedNearby) {
      const shedSpot = nearestTile(sim, personId, (x, y, i) => sim.tiles[i] === T.grass && Math.abs(x - homeX) > 1 && Math.abs(y - homeY) > 1 && Math.abs(x - homeX) + Math.abs(y - homeY) < 8, 10);
      if (shedSpot >= 0) {
        sim.projects.set(shedSpot, { type: 'shed', log: DATA.SHED.log, thatch: DATA.SHED.thatch, work: 0 });
      }
    }
  }
  return null;
}

function evalFoodProcessing(sim, personId, home, isAtHome, hasHut) {
  if (hasHut) {
    const hearth = getHearth(sim, home);
    const isLit = hearth && hearth.litUntil > sim.time;

    // 1. Bake dough in lit hearth
    if (held(sim, 1, personId, 'dough') >= 0) {
      if (isLit) return { k: 'act', slot: held(sim, 1, personId, 'dough'), act: 'bake' };
      const logInHand = held(sim, 1, personId, 'log');
      if (logInHand >= 0) return { k: 'act', slot: logInHand, act: 'stoke' };
      const logInStore = held(sim, 2, home, 'log');
      if (logInStore >= 0 && isAtHome) return { k: 'take', t: logInStore, qty: 1 };
    }

    // 2. Knead flour into dough
    if (held(sim, 1, personId, 'flour') >= 0) {
      return { k: 'act', slot: held(sim, 1, personId, 'flour'), act: 'knead' };
    }

    // 3. Mill grain and bake if bread is low
    if (isAtHome && count(sim, 2, home, 'grain') > 600 && count(sim, 2, home, 'bread') < 4) {
      if (!isLit && count(sim, 2, home, 'log') > 0) {
        const logInHand = held(sim, 1, personId, 'log');
        if (logInHand >= 0) return { k: 'act', slot: logInHand, act: 'stoke' };
        return { k: 'take', t: held(sim, 2, home, 'log'), qty: 1 };
      }
      const grainInHand = held(sim, 1, personId, 'grain');
      if (grainInHand >= 0) return { k: 'act', slot: grainInHand, act: 'mill' };
      const grainInStore = held(sim, 2, home, 'grain');
      if (grainInStore >= 0) return { k: 'take', t: grainInStore, qty: 2 };
    }
  }
  return null;
}

function evalPublicWorks(sim, personId, home, homeX, homeY, isAtHome, toHome, hasHut) {
  const food = sim.pneeds[personId * 5];
  if (hasHut && sim.phours[personId] > 2 && food > 45) {
    for (const [projTile, pr] of sim.projects) {
      const tx = projTile % sim.W;
      const ty = (projTile / sim.W) | 0;
      if (Math.abs(tx - homeX) + Math.abs(ty - homeY) < 15) {
        const near = Math.abs(sim.px[personId] - tx) + Math.abs(sim.py[personId] - ty);
        if (pr.log > 0) {
          if (count(sim, 1, personId, 'log') > 0) {
            return near <= 1 ? { k: 'act', slot: held(sim, 1, personId, 'log'), target: projTile, act: 'build' } : { k: 'go', to: adjacentFree(sim, tx, ty, sim.px[personId], sim.py[personId]), for: projTile };
          } else if (count(sim, 2, home, 'log') > 0) {
            return isAtHome ? { k: 'take', t: held(sim, 2, home, 'log'), qty: Math.min(pr.log, count(sim, 2, home, 'log')) } : toHome;
          } else {
            const axe = held(sim, 1, personId, 'axe');
            if (axe >= 0) {
              const tree = nearestTile(sim, personId, (x, y, i) => sim.tiles[i] === T.tree, 28, 1);
              if (tree >= 0) return goAct(sim, personId, tree, 'chop', axe);
            }
          }
        }
        if (pr.thatch > 0) {
          if (count(sim, 1, personId, 'thatch') > 0) {
            return near <= 1 ? { k: 'act', slot: held(sim, 1, personId, 'thatch'), target: projTile, act: 'build' } : { k: 'go', to: adjacentFree(sim, tx, ty, sim.px[personId], sim.py[personId]), for: projTile };
          } else if (count(sim, 2, home, 'thatch') > 0) {
            return isAtHome ? { k: 'take', t: held(sim, 2, home, 'thatch'), qty: Math.min(pr.thatch, count(sim, 2, home, 'thatch')) } : toHome;
          } else {
            const grassTile = nearestTile(sim, personId, (x, y, i) => sim.tiles[i] === T.grass && i !== home);
            if (grassTile >= 0) return goAct(sim, personId, grassTile, 'thatch', held(sim, 1, personId, 'knife'));
          }
        }
        if (pr.log <= 0 && pr.thatch <= 0) {
          return near <= 1 ? { k: 'act', slot: -1, target: projTile, act: 'build' } : { k: 'go', to: adjacentFree(sim, tx, ty, sim.px[personId], sim.py[personId]), for: projTile };
        }
      }
    }
  }
  return null;
}

function evalHutConstruction(sim, personId, home, isAtHome, toHome, dropToStore, hasHut, isHungryHousehold) {
  if (!hasHut && !isHungryHousehold) {
    const pr = sim.projects.get(home) || { log: DATA.HUT.log, thatch: DATA.HUT.thatch, work: 0 };
    const totalLogs = count(sim, 2, home, 'log') + count(sim, 1, personId, 'log');
    const totalThatch = count(sim, 2, home, 'thatch') + count(sim, 1, personId, 'thatch');

    if (count(sim, 1, personId, 'log') >= 2 || count(sim, 1, personId, 'thatch') >= 2) {
      return dropToStore(held(sim, 1, personId, 'log') >= 0 ? held(sim, 1, personId, 'log') : held(sim, 1, personId, 'thatch'));
    }
    if (totalLogs < pr.log) {
      const axe = held(sim, 1, personId, 'axe');
      if (axe >= 0) {
        const tree = nearestTile(sim, personId, (x, y, i) => sim.tiles[i] === T.tree, 28, 1);
        if (tree >= 0) return goAct(sim, personId, tree, 'chop', axe);
      }
    }
    if (totalThatch < pr.thatch) {
      const grassTile = nearestTile(sim, personId, (x, y, i) => sim.tiles[i] === T.grass && i !== home, 28, 2);
      if (grassTile >= 0) return goAct(sim, personId, grassTile, 'thatch', held(sim, 1, personId, 'knife'));
    }
    if (totalLogs >= pr.log && totalThatch >= pr.thatch) {
      return isAtHome ? { k: 'act', slot: -1, target: home, act: 'build' } : toHome;
    }
    if (totalLogs < pr.log && held(sim, 1, personId, 'axe') < 0) {
      const grassTile = nearestTile(sim, personId, (x, y, i) => sim.tiles[i] === T.grass && i !== home);
      if (grassTile >= 0 && totalThatch < pr.thatch) return goAct(sim, personId, grassTile, 'thatch', -1);
    }
  }
  return null;
}

function evalSpadeCrafting(sim, personId, hasHut) {
  if (held(sim, 1, personId, 'spade') < 0 && held(sim, 1, personId, 'knife') >= 0) {
    if (held(sim, 1, personId, 'log') >= 0) return { k: 'act', slot: held(sim, 1, personId, 'log'), act: 'whittle' };
    if (held(sim, 1, personId, 'axe') >= 0) {
      const tree = nearestTile(sim, personId, (x, y, i) => sim.tiles[i] === T.tree, 28, 1);
      if (tree >= 0) return goAct(sim, personId, tree, 'chop', held(sim, 1, personId, 'axe'));
    }
  }
  return null;
}

function evalHomesteadDrive(sim, personId) {
  if (sim.phome[personId] >= 0 || sim.pkind[personId] > 0) return null;

  // Search for an open, unowned grass tile
  const nearGrass = nearestTile(sim, personId, (x, y, i) => {
    if (sim.tiles[i] !== T.grass) return false;
    for (let h = 0; h < sim.households.length; h++) {
      const hx = sim.households[h].home % sim.W;
      const hy = (sim.households[h].home / sim.W) | 0;
      if (Math.abs(x - hx) + Math.abs(y - hy) < 8) return false;
    }
    return true;
  }, 32);

  if (nearGrass >= 0) {
    const gx = nearGrass % sim.W;
    const gy = (nearGrass / sim.W) | 0;
    const isAdjacent = Math.abs(sim.px[personId] - gx) + Math.abs(sim.py[personId] - gy) <= 1;
    if (isAdjacent) {
      sim.phome[personId] = nearGrass;
      sim.households.push({ home: nearGrass, founded: sim.time });
      journal(sim, `${sim.pname[personId]} staked a homestead claim.`);
      return { k: 'wait', min: 30, act: ACT.idle };
    }
    return { k: 'go', to: adjacentFree(sim, gx, gy, sim.px[personId], sim.py[personId]) };
  }
  return { k: 'move', d: sim.rng.int(4) };
}

function evalMarketTrade(sim, personId, home, isAtHome, toHome, members) {
  const storeGrain = count(sim, 2, home, 'grain');
  const inHandGrain = held(sim, 1, personId, 'grain');

  if (sim.households.length > 1 && sim.season > 0.3) {
    if (storeGrain > 400 || (inHandGrain >= 0 && count(sim, 1, personId, 'grain') >= 3)) {
      let buyerId = -1;
      let bestDist = 25;
      for (let q = 0; q < sim.pn; q++) {
        if (!sim.palive[q] || sim.phome[q] === home || sim.phome[q] < 0) continue;
        if (count(sim, 1, q, 'penny') < 2) continue;
        const d = Math.abs(sim.px[q] - sim.px[personId]) + Math.abs(sim.py[q] - sim.py[personId]);
        if (d < bestDist) {
          bestDist = d;
          buyerId = q;
        }
      }
      if (buyerId >= 0) {
        if (inHandGrain >= 0 && count(sim, 1, personId, 'grain') >= 3) {
          const near = Math.abs(sim.px[buyerId] - sim.px[personId]) + Math.abs(sim.py[buyerId] - sim.py[personId]);
          return near <= 1
            ? { k: 'act', slot: inHandGrain, target: idx(sim, sim.px[buyerId], sim.py[buyerId]), act: 'sell' }
            : { k: 'go', to: adjacentFree(sim, sim.px[buyerId], sim.py[buyerId], sim.px[personId], sim.py[personId]), for: idx(sim, sim.px[buyerId], sim.py[buyerId]) };
        }
        const storeGrainRef = held(sim, 2, home, 'grain');
        if (storeGrainRef >= 0 && isAtHome) return { k: 'take', t: storeGrainRef, qty: 3 };
        if (storeGrainRef >= 0) return toHome;
      }
    }
  }
  return null;
}

function evalAgriculturalCycle(sim, personId, home, homeX, homeY, isAtHome, toHome, dropToStore, members) {
  const storeStock = count(sim, 2, home, 'grain') + count(sim, 2, home, 'berries');
  const requiredFood = members.length * 2.5 * DATA.DAYS_PER_YEAR;

  // 1. Harvest ripe crops
  const ripeTile = sim.tileCount[T.ripe]
    ? nearestTile(sim, personId, (x, y, i) => sim.tiles[i] === T.ripe && Math.abs(x - homeX) + Math.abs(y - homeY) < 20, 28, 3)
    : -1;
  if (ripeTile >= 0) return goAct(sim, personId, ripeTile, 'harvest', held(sim, 1, personId, 'knife'));

  if (count(sim, 1, personId, 'bread') > 0 && isAtHome) return dropToStore(held(sim, 1, personId, 'bread'));
  if (count(sim, 1, personId, 'grain') >= 12) return dropToStore(held(sim, 1, personId, 'grain'));
  if (count(sim, 1, personId, 'berries') >= 12) return dropToStore(held(sim, 1, personId, 'berries'));

  const foodDays = (count(sim, 2, home, 'grain') * DATA.STUFF.grain.food + count(sim, 2, home, 'berries') * DATA.STUFF.berries.food) / (members.length * 50);
  if (foodDays < 40 && season(sim.time) > 0.35 && held(sim, 1, personId, 'spade') < 0) {
    const tree = nearestTile(sim, personId, (x, y, i) => sim.tiles[i] === T.tree && sim.tstate[i] > 0, 28, 0);
    if (tree >= 0) return goAct(sim, personId, tree, 'forage', -1);
  }

  // 2. Sowing and tilling
  if (growing(sim.time) && doyOf(sim.time) < 150) {
    const grainInHand = held(sim, 1, personId, 'grain');
    const tilledTile = (sim.tileCount[T.tilled] && storeStock < requiredFood * 1.5)
      ? nearestTile(sim, personId, (x, y, i) => sim.tiles[i] === T.tilled && Math.abs(x - homeX) + Math.abs(y - homeY) < 20, 28, 4)
      : -1;

    if (tilledTile >= 0) {
      if (grainInHand >= 0) return goAct(sim, personId, tilledTile, 'sow', grainInHand);
      if (count(sim, 2, home, 'grain') >= 2) {
        return isAtHome
          ? { k: 'take', t: held(sim, 2, home, 'grain'), qty: Math.min(6, count(sim, 2, home, 'grain') - 1) }
          : toHome;
      }
    }

    const spade = held(sim, 1, personId, 'spade');
    const desiredFields = Math.ceil(requiredFood / (DATA.CROP.yieldBase * 0.7));
    const activeFields = spade >= 0 && storeStock < requiredFood
      ? countTiles(sim, homeX, homeY, 9, i => sim.tiles[i] === T.tilled || sim.tiles[i] === T.crop || sim.tiles[i] === T.ripe)
      : 1e9;

    if (spade >= 0 && activeFields < desiredFields && storeStock < requiredFood) {
      const grassTile = nearestTile(sim, personId, (x, y, i) => sim.tiles[i] === T.grass && Math.abs(x - homeX) > 1 && Math.abs(y - homeY) > 1 && Math.abs(x - homeX) + Math.abs(y - homeY) < 16, 16, 5);
      if (grassTile >= 0) return goAct(sim, personId, grassTile, 'till', spade);
    }
  }

  if (foodDays < 60 && season(sim.time) > 0.35) {
    const tree = nearestTile(sim, personId, (x, y, i) => sim.tiles[i] === T.tree && sim.tstate[i] > 0, 28, 0);
    if (tree >= 0) return goAct(sim, personId, tree, 'forage', -1);
  }

  if (count(sim, 1, personId, 'berries') > 0 && isAtHome) return dropToStore(held(sim, 1, personId, 'berries'));
  if (count(sim, 1, personId, 'grain') > 0 && isAtHome) return dropToStore(held(sim, 1, personId, 'grain'));

  return null;
}

function heuristic(sim, personId) {
  // 1. Tactical Combat Defense & Hostile Response
  const combatIntent = evalCombatResponse(sim, personId);
  if (combatIntent) return combatIntent;

  // 2. Critical Survival Evaluators
  const survivalIntent = evalNutrition(sim, personId) || evalSleepAndWarmth(sim, personId);
  if (survivalIntent) return survivalIntent;

  // 2. Beast Ecology
  const beastIntent = evalBeastInstinct(sim, personId);
  if (beastIntent) return beastIntent;

  // 3. Social & Group Behavior
  const followIntent = evalPartyFollow(sim, personId);
  if (followIntent) return followIntent;

  const childIntent = evalChildWait(sim, personId);
  if (childIntent) return childIntent;

  const home = sim.phome[personId];
  if (home < 0) {
    const homesteadIntent = evalHomesteadDrive(sim, personId);
    return homesteadIntent || { k: 'wait', min: 30, act: ACT.idle };
  }

  const homeX = home % sim.W;
  const homeY = (home / sim.W) | 0;
  const isAtHome = Math.abs(sim.px[personId] - homeX) + Math.abs(sim.py[personId] - homeY) <= 1;
  const toHome = { k: 'go', to: adjacentFree(sim, homeX, homeY, sim.px[personId], sim.py[personId]) };
  const dropToStore = (thingId) => isAtHome ? { k: 'store', t: thingId } : toHome;
  const members = household(sim, home);
  const hasHut = sim.tiles[home] === T.hut;
  const isHungryHousehold = (count(sim, 2, home, 'grain') * DATA.STUFF.grain.food + count(sim, 2, home, 'berries') * DATA.STUFF.berries.food) / (Math.max(1, members.length) * 50) < 25;

  if (isHungryHousehold && sim.season > 0.35) {
    const berryTree = nearestTile(sim, personId, (x, y, i) => sim.tiles[i] === T.tree && sim.tstate[i] > 0, 28, 0);
    if (berryTree >= 0) return goAct(sim, personId, berryTree, 'forage', -1);
  }

  // 4. Village Projects & Economic Evaluators
  evalSurplusStorage(sim, personId, home, homeX, homeY, hasHut);

  return evalFoodProcessing(sim, personId, home, isAtHome, hasHut)
    || evalPublicWorks(sim, personId, home, homeX, homeY, isAtHome, toHome, hasHut)
    || evalHutConstruction(sim, personId, home, isAtHome, toHome, dropToStore, hasHut, isHungryHousehold)
    || evalSpadeCrafting(sim, personId, hasHut)
    || evalMarketTrade(sim, personId, home, isAtHome, toHome, members)
    || evalAgriculturalCycle(sim, personId, home, homeX, homeY, isAtHome, toHome, dropToStore, members)
    || { k: 'wait', min: 30 + sim.rng.int(60), act: ACT.idle };
}


// ============================================================================
// ==== 6. PURE RULES & AFFORDANCE RESOLUTION ====
// ============================================================================

function ruleNeeds(sim, personId, deltaMinutes) {
  const needsOffset = personId * 5;
  const currentTile = idx(sim, sim.px[personId], sim.py[personId]);
  const isInsideShelter = sim.tiles[currentTile] === T.hut;
  const coldFactor = Math.max(0, 0.45 - sim.season) * 2.5;
  const childMultiplier = ageYears(sim, personId) < DATA.ADULT_YEARS ? 0.5 : 1.0;
  const hearth = isInsideShelter ? getHearth(sim, currentTile) : null;
  const isHearthLit = hearth && hearth.litUntil > sim.time;

  for (let needIndex = 0; needIndex < 5; needIndex++) {
    let decayAmount = DATA.NEED_DECAY[needIndex] * deltaMinutes * (needIndex === 0 ? childMultiplier : 1.0);
    if (needIndex === 2) { // Warmth
      if (isInsideShelter && isHearthLit) {
        decayAmount = -DATA.NEED_DECAY[2] * deltaMinutes * 8.0; // Rapid warming
        sim.pexposed[personId] = 0; // Clear cold exposure
      } else if (isInsideShelter) {
        decayAmount = -DATA.NEED_DECAY[2] * deltaMinutes * 2.0; // Passive shelter warmth
        if (sim.pneeds[needsOffset + 2] > 20) sim.pexposed[personId] = 0;
      } else {
        decayAmount = decayAmount * coldFactor;
      }
    }
    sim.pneeds[needsOffset + needIndex] = Math.max(0, Math.min(100, sim.pneeds[needsOffset + needIndex] - decayAmount));
  }
}

function ruleMove(sim, personId, direction) {
  sim.pface[personId] = direction;
  const targetX = sim.px[personId] + DIRS[direction][0];
  const targetY = sim.py[personId] + DIRS[direction][1];
  if (!walkable(sim, targetX, targetY)) return 0;

  const oldX = sim.px[personId];
  const oldY = sim.py[personId];
  clearSpatialOccupant(sim, personId, oldX, oldY);
  if (sim.pgrid) {
    sim.pgrid[targetY * sim.W + targetX] = personId + 1;
  }

  sim.pgoFrom[personId] = idx(sim, oldX, oldY);
  sim.pgoStart[personId] = sim.time;
  sim.pgoEnd[personId] = sim.time + DATA.WALK_MIN;
  sim.px[personId] = targetX;
  sim.py[personId] = targetY;
  return DATA.WALK_MIN;
}

function ruleGo(sim, personId, targetTile) {
  if (targetTile < 0) return 0;
  const targetX = targetTile % sim.W;
  const targetY = (targetTile / sim.W) | 0;
  const distance = pathLen(sim, sim.px[personId], sim.py[personId], targetX, targetY);
  if (distance < 0) return 0;

  const oldX = sim.px[personId];
  const oldY = sim.py[personId];
  clearSpatialOccupant(sim, personId, oldX, oldY);
  if (sim.pgrid) {
    sim.pgrid[targetY * sim.W + targetX] = personId + 1;
  }

  sim.pgoFrom[personId] = idx(sim, oldX, oldY);
  sim.pgoStart[personId] = sim.time;
  sim.pgoEnd[personId] = sim.time + distance * DATA.WALK_MIN;
  sim.px[personId] = targetX;
  sim.py[personId] = targetY;

  const dx = targetX - oldX;
  const dy = targetY - oldY;
  sim.pface[personId] = Math.abs(dx) > 0 ? (dx > 0 ? 3 : 2) : (dy > 0 ? 0 : 1);
  return distance * DATA.WALK_MIN;
}

function validHeld(sim, personId, slot) {
  if (slot === undefined || slot < 0) return -1;
  const h = hands(sim, personId);
  if (slot < h.length && h[slot] !== undefined) {
    const id = h[slot];
    if (sim.tholderKind[id] === 1 && sim.tholder[id] === personId && sim.tqty[id] > 0) return id;
  }
  if (sim.tholderKind[slot] === 1 && sim.tholder[slot] === personId && sim.tqty[slot] > 0) return slot;
  return -1;
}

function affordances(sim, personId, targetTile, onlySlot) {
  const affordanceList = [];
  const tile = sim.tiles[targetTile];
  const tx = targetTile % sim.W;
  const ty = (targetTile / sim.W) | 0;
  let otherPerson = personAt(sim, tx, ty) - 1;
  if (otherPerson === personId) otherPerson = -1;

  const selectedSlot = validHeld(sim, personId, onlySlot);
  const add = (act, label, slot) => affordanceList.push({ act, label, slot: slot === undefined ? -1 : slot, tile: targetTile });

  // 1. Direct hand tool actions (eat, drink, fill, bandage)
  if (selectedSlot >= 0) {
    const stuffDef = DATA.STUFF[sim.tstuff[selectedSlot]];
    const isBroken = stuffDef.tool && sim.twear[selectedSlot] >= 1.0;

    if (!isBroken) {
      if (stuffDef.kind === 'food') add('eat', 'Eat the ' + stuffDef.name, selectedSlot);
      if (stuffDef.name === 'waterskin') {
        if (tile === T.stream || tile === T.ford || tile === T.well || tile === T.bridge) add('fill', 'Fill waterskin with fresh water', selectedSlot);
        add('drink', 'Drink fresh water', selectedSlot);
      }
      if (stuffDef.name === 'cloth') add('bandage', 'Bandage wounds', selectedSlot);
    }
  }

  // 2. Physical ground item pickups (take) - check every distinct item on this tile
  if (hands(sim, personId).length < 7) {
    for (let t = 0; t < sim.tn; t++) {
      if (sim.tholderKind[t] === 2 && sim.tholder[t] === targetTile && sim.tqty[t] > 0 && tile !== T.frame) {
        add('take', 'Pick up ' + DATA.STUFF[sim.tstuff[t]].name + (sim.tqty[t] > 1 ? ' ×' + sim.tqty[t] : ''), t);
      }
    }
  }

  // 3. Water & Well direct drinking
  if (tile === T.stream || tile === T.ford || tile === T.well) {
    if (selectedSlot < 0) add('drink', 'Drink fresh water');
  }

  // 4. Person interactions (talk, attack, trade, gift)
  if (otherPerson >= 0 && sim.palive[otherPerson]) {
    const isHostile = (sim.penemy && sim.penemy[personId] === otherPerson) ||
                      (sim.penemy && sim.penemy[otherPerson] === personId) ||
                      regardOf(sim, personId, otherPerson) <= -30 ||
                      regardOf(sim, otherPerson, personId) <= -30;
    if (selectedSlot >= 0) {
      const stuffDef = DATA.STUFF[sim.tstuff[selectedSlot]];
      const isBroken = stuffDef.tool && sim.twear[selectedSlot] >= 1.0;
      if (!isBroken) {
        if (sim.pkind[otherPerson] > 0 || sim.pkind[personId] > 0 || isHostile) add('attack', 'Attack ' + sim.pname[otherPerson], selectedSlot);
        if (stuffDef.kind === 'coin') add('give', 'Give a penny to ' + sim.pname[otherPerson], selectedSlot);
        if (stuffDef.kind !== 'coin') {
          const offerQty = Math.min(20, sim.tqty[selectedSlot]);
          const offer = tradeOffer(sim, personId, otherPerson, sim.tstuff[selectedSlot], offerQty);
          if (offer.ok) add('sell', `Sell ${offerQty} ${sim.tstuff[selectedSlot]} for ${offer.ask}`, selectedSlot);
          else add('offer', `Offer ${offerQty} ${sim.tstuff[selectedSlot]} — ${sim.pname[otherPerson]} won't pay`, selectedSlot);
        }
      }
    } else {
      if (sim.pkind[otherPerson] > 0 || sim.pkind[personId] > 0 || isHostile) add('attack', 'Attack ' + sim.pname[otherPerson]);
      add('talk', 'Talk to ' + sim.pname[otherPerson]);
    }
  }

  // 5. World, crafting & construction actions
  const here = idx(sim, sim.px[personId], sim.py[personId]);
  const isAtHut = tile === T.hut || sim.tiles[here] === T.hut;
  const hutTile = tile === T.hut ? targetTile : (sim.tiles[here] === T.hut ? here : -1);
  const hearth = hutTile >= 0 ? getHearth(sim, hutTile) : null;
  const isHearthLit = hearth && hearth.litUntil > sim.time;

  if (selectedSlot >= 0) {
    const stuffDef = DATA.STUFF[sim.tstuff[selectedSlot]];
    const isBroken = stuffDef.tool && sim.twear[selectedSlot] >= 1.0;

    if (isBroken) {
      add('inspect', 'Broken ' + stuffDef.name, selectedSlot);
    } else {
      if (stuffDef.tool === 'axe' && tile === T.tree) add('chop', 'Fell the tree', selectedSlot);
      if (stuffDef.tool === 'spade' && (tile === T.grass || tile === T.tilled)) add('till', 'Break the ground', selectedSlot);
      if (stuffDef.tool === 'knife' && tile === T.grass) add('thatch', 'Cut thatch', selectedSlot);
      if (stuffDef.tool === 'knife' && tile === T.ripe) add('harvest', 'Reap the grain', selectedSlot);
      if (stuffDef.tool === 'knife' && sim.tstuff[selectedSlot] !== 'log') {
        const log = hands(sim, personId).find(t => sim.tstuff[t] === 'log');
        if (log !== undefined) add('whittle', 'Whittle a spade', log);
      }
      if (stuffDef.seed && tile === T.tilled) add('sow', 'Sow the grain', selectedSlot);
      if (stuffDef.name === 'grain') add('mill', 'Grind grain into flour', selectedSlot);
      if (stuffDef.name === 'flour') add('knead', 'Knead flour into dough', selectedSlot);
      if (stuffDef.name === 'dough' || stuffDef.name === 'flour') {
        if (isAtHut && isHearthLit) add('bake', 'Bake bread in the hot hearth oven', selectedSlot);
        else if (isAtHut) add('inspect', 'Baking requires a lit hearth fire', selectedSlot);
        else add('inspect', 'Baking requires a hearth oven inside a cabin', selectedSlot);
      }
      if (stuffDef.name === 'meat') {
        if (isAtHut && isHearthLit) add('roast', 'Roast meat over the hearth fire', selectedSlot);
        else add('inspect', 'Roasting requires a lit fire', selectedSlot);
      }
      if (stuffDef.name === 'log' || stuffDef.name === 'firewood') {
        if (isAtHut) add('stoke', isHearthLit ? 'Stoke the hearth fire with wood' : 'Kindle the cabin hearth fire', selectedSlot);
        if (stuffDef.name === 'log' && tile === T.grass) add('fence', 'Erect wooden fence', selectedSlot);
      }
      if (stuffDef.tool === 'grimoire') add('cast', 'Cast ritual spell', selectedSlot);
    }

    if (stuffDef.kind === 'part' && (tile === T.grass || tile === T.frame)) add('store', 'Leave materials here', selectedSlot);
    if (tile === T.hut || tile === T.shed) add('store', 'Store ' + stuffDef.name + ' inside', selectedSlot);
    if (DATA.TILE_WALK[tile] === 1 && tile !== T.hut) add('drop', 'Drop ' + stuffDef.name + ' on the ground', selectedSlot);
  } else {
    // Empty hands affordances
    if (tile === T.hut || tile === T.shed) add('enter', 'Go inside');
    if (tile === T.frame || sim.projects.has(targetTile)) add('build', 'Work on the building');
    if (tile === T.ripe) add('harvest', 'Reap the grain by hand');
    if (tile === T.tree && sim.season > 0.35 && sim.tstate[targetTile] > 0) add('forage', 'Pick berries');
    if (tile === T.grass && targetTile !== sim.phome[personId]) add('thatch', 'Gather thatch');
  }

  // 6. Inspect
  add('inspect', otherPerson >= 0 && sim.palive[otherPerson] ? 'Look at ' + sim.pname[otherPerson] : 'Look at the ' + tileName(sim, targetTile));
  return affordanceList;
}

function tileName(sim, tileIndex) {
  const tile = sim.tiles[tileIndex];
  return ['grass', 'water', 'road', 'tree', 'broken ground', 'young crop', 'ripe grain', 'hut', 'half-built frame', 'ford', 'fence', 'storage shed', 'well', 'bridge'][tile] || 'ground';
}

function describe(sim, personId, tileIndex) {
  const tile = sim.tiles[tileIndex];
  const tx = tileIndex % sim.W;
  const ty = (tileIndex / sim.W) | 0;
  const lines = [];
  let otherPerson = personAt(sim, tx, ty) - 1;
  if (otherPerson === personId) otherPerson = -1;

  if (otherPerson >= 0 && sim.palive[otherPerson]) {
    const o = read(sim, { person: otherPerson });
    lines.push(['who', `${o.name}, ${o.age} years`]);
    lines.push(['doing', o.act === 'idle' ? 'nothing in particular' : o.act]);
    lines.push(['carrying', o.hands.map(h => h.name + (h.qty > 1 ? ' ×' + h.qty : '')).join(', ') || 'nothing']);
    const home = sim.phome[otherPerson];
    lines.push(['home', home >= 0 ? (sim.tiles[home] === T.hut ? 'a hut nearby' : 'a claim nearby') : 'none']);

    if (personId >= 0) {
      const r = regardOf(sim, otherPerson, personId);
      const kinship = getKinshipRelation(sim, personId, otherPerson);
      let relationStr = '';
      if (kinship) relationStr += `${kinship} • `;
      if (r >= 50) relationStr += `Devoted Kin (+${r})`;
      else if (r >= 30) relationStr += `Trusted Friend (+${r})`;
      else if (r >= 10) relationStr += `Friendly (+${r})`;
      else if (r >= -10) relationStr += `Stranger (${r})`;
      else if (r >= -30) relationStr += `Suspicious (${r})`;
      else relationStr += `Hostile Enemy (${r})`;

      lines.push(['relation', relationStr]);
      const hospitality = (r >= 30 || (sim.phome[personId] === home && home >= 0))
        ? 'welcome guest (shares food)'
        : 'stranger (taking food is theft)';
      lines.push(['sharing', hospitality]);
    } else {
      let totalRegard = 0, countRegard = 0;
      for (let p = 0; p < sim.pn; p++) {
        if (p !== otherPerson && sim.palive[p]) {
          totalRegard += regardOf(sim, p, otherPerson);
          countRegard++;
        }
      }
      const avg = countRegard > 0 ? Math.round(totalRegard / countRegard) : 0;
      const standing = avg >= 30 ? `Respected Leader (+${avg})` :
                       avg >= 10 ? `Well-Liked (+${avg})` :
                       avg >= -10 ? `Ordinary Citizen (${avg})` :
                       avg >= -30 ? `Distrusted (${avg})` : `Outlaw / Shunned (${avg})`;
      lines.push(['standing', standing]);
    }

    return { title: o.name, lines };
  }

  lines.push(['ground', tileName(sim, tileIndex)]);
  if (tile === T.crop) lines.push(['sown', Math.round((sim.time - sim.tstate[tileIndex]) / 1440) + ' days ago']);
  if (tile === T.tree) lines.push(['berries', sim.tstate[tileIndex] > 0 ? (sim.season > 0.35 ? 'ripe' : 'not in season') : 'picked over']);
  if (tile === T.tilled) lines.push(['soil', ['poor', 'fair', 'good', 'rich'][Math.min(3, Math.floor((sim.psoil[((ty >> 5) * sim.PW) + (tx >> 5)]) / 0.35))]]);

  const pr = sim.projects.get(tileIndex);
  if (pr) lines.push(['needs', `${pr.log} logs, ${pr.thatch} thatch, ${Math.max(0, DATA.HUT_HOURS - pr.work).toFixed(1)} h work`]);
  if (tile === T.hut) {
    const members = household(sim, tileIndex).map(q => sim.pname[q]).join(' and ');
    lines.push(['household', members || 'nobody']);
    const hearth = getHearth(sim, tileIndex);
    const isLit = hearth && hearth.litUntil > sim.time;
    const hoursLeft = isLit ? ((hearth.litUntil - sim.time) / 60).toFixed(1) + 'h' : 'cold';
    lines.push(['hearth', isLit ? `burning (${hoursLeft} left)` : 'cold / unlit']);
    const storeItems = read(sim, { site: tileIndex });
    lines.push(['store', storeItems.map(s => s.name + (s.qty > 1 ? ' ×' + s.qty : '')).join(', ') || 'empty']);
  }

  const groundItems = [];
  for (let k = 0; k < sim.tn; k++) {
    if (sim.tholderKind[k] === 2 && sim.tholder[k] === tileIndex && sim.tqty[k] > 0) {
      groundItems.push(DATA.STUFF[sim.tstuff[k]].name + (sim.tqty[k] > 1 ? ' ×' + sim.tqty[k] : ''));
    }
  }
  if (groundItems.length) lines.push(['lying here', groundItems.join(', ')]);
  return { title: tileName(sim, tileIndex), lines };
}

function chooseAct(sim, personId, slot, target, actName) {
  const facingX = sim.px[personId] + DIRS[sim.pface[personId]][0];
  const facingY = sim.py[personId] + DIRS[sim.pface[personId]][1];
  const hereTile = idx(sim, sim.px[personId], sim.py[personId]);
  const targetTile = target >= 0 ? target : idx(sim, facingX, facingY);
  const tx = targetTile % sim.W;
  const ty = (targetTile / sim.W) | 0;

  if (target >= 0 && (tx !== sim.px[personId] || ty !== sim.py[personId])) {
    sim.pface[personId] = tx > sim.px[personId] ? 3 : tx < sim.px[personId] ? 2 : ty > sim.py[personId] ? 0 : 1;
  }

  if (actName) {
    let resolvedSlot = slot ?? -1;
    if (resolvedSlot < 0) {
      for (const t of hands(sim, personId)) {
        const match = affordances(sim, personId, targetTile, t).find(o => o.act === actName);
        if (match) { resolvedSlot = match.slot; break; }
      }
      if (resolvedSlot < 0) {
        const match = affordances(sim, personId, targetTile, -1).find(o => o.act === actName);
        if (match) resolvedSlot = match.slot;
      }
      if (resolvedSlot < 0 && targetTile !== hereTile) {
        const match = affordances(sim, personId, hereTile, -1).find(o => o.act === actName);
        if (match) resolvedSlot = match.slot;
      }
    }
    return { act: actName, slot: resolvedSlot, ti: targetTile };
  }

  // Check underfoot ground items first if no explicit target
  const underfootList = affordances(sim, personId, hereTile, slot);
  const underfootTake = underfootList.find(a => a.act === 'take');
  if (underfootTake && (target < 0 || target === hereTile)) {
    return { ...underfootTake, ti: hereTile };
  }

  let topAffordance = affordances(sim, personId, targetTile, slot)[0];
  if (!topAffordance || topAffordance.act === 'inspect') {
    const underfootAffordance = underfootList[0];
    if (underfootAffordance && underfootAffordance.act !== 'inspect') {
      return { ...underfootAffordance, ti: hereTile };
    }
  }
  return topAffordance ? { ...topAffordance, ti: targetTile } : null;
}

function applyAct(sim, personId, targetTile, action) {
  const tile = sim.tiles[targetTile];
  const tx = targetTile % sim.W;
  const ty = (targetTile / sim.W) | 0;
  const slot = action.slot;
  const actRes = (name, extra) => ({ min: DATA.ACT_MIN[name] || 1, act: ACT[name] || ACT.idle, ...extra });

  switch (action.act) {
    case 'talk': {
      const other = personAt(sim, tx, ty) - 1;
      if (other < 0 || other === personId) return { min: 0, act: ACT.idle };
      journal(sim, `${sim.pname[personId]} spoke with ${sim.pname[other]}.`);
      return actRes('talk', { ev: { k: 'meet', a: personId, b: other } });
    }
    case 'sell': {
      const other = personAt(sim, tx, ty) - 1;
      if (other < 0 || other === personId) return { min: 0, act: ACT.idle };
      const stuff = sim.tstuff[slot];
      const quantity = Math.min(20, sim.tqty[slot]);
      const offer = tradeOffer(sim, personId, other, stuff, quantity);
      if (offer.ok) doTrade(sim, personId, other, stuff, quantity, offer.ask);
      return actRes('talk');
    }
    case 'offer': {
      const other = personAt(sim, tx, ty) - 1;
      if (other >= 0 && other !== personId) journal(sim, `${sim.pname[other]} shook their head at the price.`);
      return actRes('talk');
    }
    case 'give': {
      const other = personAt(sim, tx, ty) - 1;
      if (other < 0 || other === personId) return { min: 0, act: ACT.idle };
      moveThing(sim, slot, other, 1, 1);
      journal(sim, `${sim.pname[personId]} gave ${sim.pname[other]} a penny.`);
      return actRes('talk');
    }
    case 'drop': {
      const validSlot = validHeld(sim, personId, slot);
      if (validSlot < 0) return { min: 0, act: ACT.idle };
      const here = idx(sim, sim.px[personId], sim.py[personId]);
      moveThing(sim, validSlot, here, 2, 1);
      journal(sim, `${sim.pname[personId]} set down ${DATA.STUFF[sim.tstuff[validSlot]].name} on the ground.`);
      return actRes('store');
    }
    case 'fill': {
      const validSlot = validHeld(sim, personId, slot);
      if (validSlot < 0) return { min: 0, act: ACT.idle };
      journal(sim, `${sim.pname[personId]} filled the waterskin from the fresh stream.`);
      return actRes('take');
    }
    case 'drink': {
      const validSlot = validHeld(sim, personId, slot);
      if (validSlot >= 0 && sim.tstuff[validSlot] === 'waterskin') {
        sim.pneeds[personId * 5 + 3] = Math.min(100, sim.pneeds[personId * 5 + 3] + 15);
        journal(sim, `${sim.pname[personId]} drank fresh water from the waterskin.`);
        return actRes('eat');
      }
      sim.pneeds[personId * 5 + 3] = Math.min(100, sim.pneeds[personId * 5 + 3] + 10);
      journal(sim, `${sim.pname[personId]} drank fresh water.`);
      return actRes('eat');
    }
    case 'enter': {
      sim.pgoFrom[personId] = idx(sim, sim.px[personId], sim.py[personId]);
      sim.pgoStart[personId] = sim.time;
      sim.pgoEnd[personId] = sim.time + DATA.ACT_MIN.enter;
      sim.px[personId] = tx;
      sim.py[personId] = ty;
      journal(sim, `${sim.pname[personId]} stepped inside.`);
      return { min: DATA.ACT_MIN.enter, act: ACT.enter, open: 'site', site: targetTile };
    }
    case 'inspect':
      return { min: 0.2, act: ACT.idle, open: 'inspect', site: targetTile };

    case 'store': {
      const validSlot = validHeld(sim, personId, slot);
      if (validSlot < 0) return { min: 0, act: ACT.idle };
      moveThing(sim, validSlot, targetTile, 2);
      if (tile !== T.hut && !sim.projects.has(targetTile)) {
        sim.projects.set(targetTile, { log: DATA.HUT.log, thatch: DATA.HUT.thatch, work: 0 });
        setTile(sim, targetTile, T.frame);
      }
      return actRes('store');
    }
    case 'take': {
      if (slot < 0 || sim.tholderKind[slot] !== 2 || sim.tqty[slot] <= 0 || hands(sim, personId).length >= 7) {
        return { min: 0, act: ACT.idle };
      }
      const stuffName = DATA.STUFF[sim.tstuff[slot]].name;
      const perm = checkAccessPermission(sim, personId, targetTile, stuffName);

      moveThing(sim, slot, personId, 1);

      if (perm.isTheft) {
        if (perm.witnessed) {
          const witness = perm.witnesses[0];
          journal(sim, `${sim.pname[witness]} caught ${sim.pname[personId]} stealing ${stuffName}! "Thief!"`);
          for (const w of perm.witnesses) {
            regardShift(sim, w, personId, -60);
            if (sim.penemy) sim.penemy[w] = personId;
          }
          for (const o of perm.owners) {
            regardShift(sim, o, personId, -80);
            if (sim.penemy) sim.penemy[o] = personId;
          }
        } else {
          journal(sim, `${sim.pname[personId]} stealthily took ${stuffName} from the store.`);
        }
      } else if (perm.isFriend) {
        regardShift(sim, perm.owners[0], personId, 1);
        sim.pneeds[personId * 5 + 4] = Math.min(100, sim.pneeds[personId * 5 + 4] + 5);
        journal(sim, `${sim.pname[personId]} shared ${stuffName} from ${sim.pname[perm.owners[0]]}'s hearth as a welcome friend.`);
      } else {
        journal(sim, `${sim.pname[personId]} picked up ${stuffName}.`);
      }
      return actRes('take');
    }
    case 'mill': {
      const validSlot = validHeld(sim, personId, slot);
      if (validSlot < 0) return { min: 0, act: ACT.idle };
      setQty(sim, validSlot, sim.tqty[validSlot] - 1);
      addThing(sim, { stuff: 'flour', qty: 2, holder: personId, holderKind: 1 });
      journal(sim, `${sim.pname[personId]} ground grain into flour.`);
      return actRes('mill');
    }
    case 'knead': {
      const validSlot = validHeld(sim, personId, slot);
      if (validSlot < 0) return { min: 0, act: ACT.idle };
      setQty(sim, validSlot, sim.tqty[validSlot] - 1);
      addThing(sim, { stuff: 'dough', qty: 1, holder: personId, holderKind: 1 });
      gainSkill(sim, personId, 7, 0.05); // Cooking skill
      journal(sim, `${sim.pname[personId]} kneaded flour into dough.`);
      return actRes('knead');
    }
    case 'bake': {
      const validSlot = validHeld(sim, personId, slot);
      if (validSlot < 0) return { min: 0, act: ACT.idle };
      const here = idx(sim, sim.px[personId], sim.py[personId]);
      const hutTile = tile === T.hut ? targetTile : (sim.tiles[here] === T.hut ? here : -1);
      const hearth = hutTile >= 0 ? getHearth(sim, hutTile) : null;
      if (!hearth || hearth.litUntil <= sim.time) {
        journal(sim, `${sim.pname[personId]} cannot bake bread without a hot hearth fire.`);
        return { min: 0, act: ACT.idle };
      }
      setQty(sim, validSlot, sim.tqty[validSlot] - 1);
      addThing(sim, { stuff: 'bread', qty: 1, holder: personId, holderKind: 1 });
      gainSkill(sim, personId, 7, 0.1);
      journal(sim, `${sim.pname[personId]} baked a golden loaf of bread in the hearth oven.`);
      return actRes('bake');
    }
    case 'roast': {
      const validSlot = validHeld(sim, personId, slot);
      if (validSlot < 0) return { min: 0, act: ACT.idle };
      const here = idx(sim, sim.px[personId], sim.py[personId]);
      const hutTile = tile === T.hut ? targetTile : (sim.tiles[here] === T.hut ? here : -1);
      const hearth = hutTile >= 0 ? getHearth(sim, hutTile) : null;
      if (!hearth || hearth.litUntil <= sim.time) {
        journal(sim, `${sim.pname[personId]} needs a burning fire to roast meat.`);
        return { min: 0, act: ACT.idle };
      }
      setQty(sim, validSlot, sim.tqty[validSlot] - 1);
      addThing(sim, { stuff: 'roast_meat', qty: 1, holder: personId, holderKind: 1 });
      gainSkill(sim, personId, 7, 0.1);
      journal(sim, `${sim.pname[personId]} roasted savory meat over the hearth fire.`);
      return actRes('roast');
    }
    case 'stoke': {
      const validSlot = validHeld(sim, personId, slot);
      if (validSlot < 0) return { min: 0, act: ACT.idle };
      const here = idx(sim, sim.px[personId], sim.py[personId]);
      const hutTile = tile === T.hut ? targetTile : (sim.tiles[here] === T.hut ? here : -1);
      if (hutTile < 0) return { min: 0, act: ACT.idle };
      const hearth = getHearth(sim, hutTile);
      const isLog = sim.tstuff[validSlot] === 'log';
      const duration = isLog ? 720 : 360; // 12h for log, 6h for firewood
      hearth.litUntil = Math.max(sim.time, hearth.litUntil) + duration;
      hearth.firewood++;
      setQty(sim, validSlot, sim.tqty[validSlot] - 1);
      journal(sim, `${sim.pname[personId]} stoked the cabin hearth fire with ${isLog ? 'a log' : 'firewood'}.`);
      return actRes('stoke');
    }
    case 'fence': {
      const validSlot = validHeld(sim, personId, slot);
      if (validSlot < 0 || tile !== T.grass) return { min: 0, act: ACT.idle };
      setQty(sim, validSlot, sim.tqty[validSlot] - 1);
      setTile(sim, targetTile, T.fence);
      journal(sim, `${sim.pname[personId]} put up a fence.`);
      return actRes('fence');
    }
    case 'bandage': {
      const validSlot = validHeld(sim, personId, slot);
      if (validSlot >= 0) {
        setQty(sim, validSlot, sim.tqty[validSlot] - 1);
        for (let r = 0; r < 6; r++) {
          if (sim.pwounds[personId * 6 + r] > 0) {
            sim.pwounds[personId * 6 + r] = Math.max(0, sim.pwounds[personId * 6 + r] - 0.5);
            break;
          }
        }
        gainSkill(sim, personId, 10, 0.1);
        journal(sim, `${sim.pname[personId]} bandaged their wounds.`);
        return actRes('bandage');
      }
      return { min: 0, act: ACT.idle };
    }
    case 'attack': {
      const other = personAt(sim, tx, ty) - 1;
      if (other < 0 || other === personId || !sim.palive[other]) return { min: 0, act: ACT.idle };
      const validSlot = validHeld(sim, personId, slot);
      const weapon = validSlot >= 0 ? DATA.STUFF[sim.tstuff[validSlot]] : null;
      const basePower = weapon && weapon.tool === 'axe' ? 0.4 : weapon && weapon.tool === 'bow' ? 0.35 : weapon && weapon.tool === 'knife' ? 0.25 : 0.15;
      const power = basePower * (1 + (sim.pskills[personId * 12 + 9] || 0) / 100);
      const hitRegion = sim.rng.int(6);

      sim.pwounds[other * 6 + hitRegion] = Math.min(1.0, sim.pwounds[other * 6 + hitRegion] + power);
      gainSkill(sim, personId, 9, 0.1);
      journal(sim, `${sim.pname[personId]} struck ${sim.pname[other]}.`);

      regardShift(sim, other, personId, -70);
      regardShift(sim, personId, other, -30);
      if (sim.penemy) {
        sim.penemy[other] = personId;
        sim.penemy[personId] = other;
      }
      for (let p = 0; p < sim.pn; p++) {
        if (!sim.palive[p] || p === personId || p === other || sim.pkind[p] > 0) continue;
        if (regardOf(sim, p, other) >= 30 && hasLineOfSight(sim, sim.px[p], sim.py[p], tx, ty, 10)) {
          regardShift(sim, p, personId, -50);
          if (sim.penemy) sim.penemy[p] = personId;
        }
      }

      let totalWounds = 0;
      for (let r = 0; r < 6; r++) totalWounds += sim.pwounds[other * 6 + r];
      if (totalWounds >= 1.0 || sim.pwounds[other * 6] >= 1.0 || sim.pwounds[other * 6 + 1] >= 1.0) {
        die(sim, other, 'combat', `${sim.pname[other]} was slain in combat.`);
        if (sim.pkind[other] > 0) {
          addThing(sim, { stuff: 'meat', qty: 3, holder: targetTile, holderKind: 2 });
          addThing(sim, { stuff: 'hide', qty: 2, holder: targetTile, holderKind: 2 });
          const bountyIdx = sim.board.findIndex(b => b.type === 'bounty' && b.targetKind === sim.pkind[other]);
          if (bountyIdx >= 0) {
            const bounty = sim.board.splice(bountyIdx, 1)[0];
            addThing(sim, { stuff: 'penny', qty: bounty.reward, holder: personId, holderKind: 1 });
            journal(sim, `${sim.pname[personId]} claimed ${bounty.reward} pennies bounty for slaying the ${DATA.BEASTS[sim.pkind[other]]}.`);
          }
        }
      }
      return actRes('attack');
    }
    case 'cast': {
      gainSkill(sim, personId, 11, 0.2);
      for (let i = 0; i < sim.psoil.length; i++) sim.psoil[i] = Math.min(1.2, sim.psoil[i] + 0.05);
      journal(sim, `${sim.pname[personId]} cast a ritual blessing on the land.`);
      return actRes('cast');
    }
    case 'eat': {
      const validSlot = validHeld(sim, personId, slot);
      if (validSlot < 0) return { min: 0, act: ACT.idle };
      const foodDef = DATA.STUFF[sim.tstuff[validSlot]];
      if (!foodDef || foodDef.kind !== 'food') return { min: 0, act: ACT.idle };
      sim.pneeds[personId * 5] = Math.min(100, sim.pneeds[personId * 5] + foodDef.food);
      setQty(sim, validSlot, sim.tqty[validSlot] - 1);
      journal(sim, `${sim.pname[personId]} ate ${foodDef.name}.`);
      return actRes('eat');
    }
    case 'chop': {
      if (tile !== T.tree) return { min: 0, act: ACT.idle };
      const validSlot = validHeld(sim, personId, slot);
      if (validSlot >= 0) wearTool(sim, validSlot, 0.03);
      gainSkill(sim, personId, 1, 0.08);
      setTile(sim, targetTile, T.grass);
      sim.tstate[targetTile] = 0;
      addThing(sim, { stuff: 'log', qty: 2, holder: personId, holderKind: 1 });
      return actRes('chop');
    }
    case 'forage': {
      if (sim.tstate[targetTile] <= 0 || sim.season <= 0.35) return actRes('forage');
      addThing(sim, { stuff: 'berries', qty: 2, holder: personId, holderKind: 1 });
      sim.tstate[targetTile] = -60; // Berries return in 60 days
      return actRes('forage');
    }
    case 'thatch': {
      addThing(sim, { stuff: 'thatch', qty: 1, holder: personId, holderKind: 1 });
      return actRes('thatch');
    }
    case 'till': {
      if (tile !== T.grass && tile !== T.tilled) return { min: 0, act: ACT.idle };
      const validSlot = validHeld(sim, personId, slot);
      if (validSlot >= 0) wearTool(sim, validSlot, 0.02);
      gainSkill(sim, personId, 0, 0.06);
      setTile(sim, targetTile, T.tilled);
      return actRes('till');
    }
    case 'sow': {
      const validSlot = validHeld(sim, personId, slot);
      if (validSlot < 0 || tile !== T.tilled) return { min: 0, act: ACT.idle };
      setQty(sim, validSlot, sim.tqty[validSlot] - 1);
      setTile(sim, targetTile, T.crop);
      sim.tstate[targetTile] = sim.time;
      return actRes('sow');
    }
    case 'harvest': {
      if (tile !== T.ripe) return { min: 0, act: ACT.idle };
      const validSlot = validHeld(sim, personId, slot);
      if (validSlot >= 0) wearTool(sim, validSlot, 0.02);
      gainSkill(sim, personId, 0, 0.05);
      const parcelIdx = ((ty >> 5) * sim.PW) + (tx >> 5);
      const yieldQty = Math.max(1, Math.round(DATA.CROP.yieldBase * sim.psoil[parcelIdx] * Math.min(1.2, sim.rain[yearOf(sim.tstate[targetTile])] || 1)));
      addThing(sim, { stuff: 'grain', qty: yieldQty, holder: personId, holderKind: 1 });
      setTile(sim, targetTile, T.tilled);
      sim.psoil[parcelIdx] = Math.max(0.3, sim.psoil[parcelIdx] - 0.0015);
      return actRes('harvest');
    }
    case 'whittle': {
      const validSlot = validHeld(sim, personId, slot);
      if (validSlot < 0) return { min: 0, act: ACT.idle };
      gainSkill(sim, personId, 2, 0.1);
      setQty(sim, validSlot, sim.tqty[validSlot] - 1);
      addThing(sim, { stuff: 'spade', holder: personId, holderKind: 1 });
      journal(sim, `${sim.pname[personId]} whittled a spade.`);
      return actRes('whittle');
    }
    case 'build': {
      if (action.slot >= 0 && !sim.projects.has(targetTile)) {
        sim.projects.set(targetTile, { log: DATA.HUT.log, thatch: DATA.HUT.thatch, work: 0 });
      }
      return ruleBuild(sim, personId, targetTile);
    }
  }
  return { min: 0, act: ACT.idle };
}

function ruleBuild(sim, personId, targetTile) {
  let project = sim.projects.get(targetTile);
  if (!project) {
    project = { log: DATA.HUT.log, thatch: DATA.HUT.thatch, work: 0 };
    sim.projects.set(targetTile, project);
  }

  for (const part of ['log', 'thatch']) {
    while (project[part] > 0) {
      let partThing = held(sim, 2, targetTile, part);
      if (partThing < 0) partThing = held(sim, 1, personId, part);
      if (partThing < 0) break;
      setQty(sim, partThing, sim.tqty[partThing] - 1);
      project[part]--;
    }
  }

  if (project.log > 0 || project.thatch > 0) {
    setTile(sim, targetTile, T.frame);
    return { min: DATA.ACT_MIN.build / 4, act: ACT.build };
  }

  project.work += DATA.ACT_MIN.build / 60;
  setTile(sim, targetTile, T.frame);
  const requiredHours = project.reqHours || (project.type === 'shed' ? DATA.SHED_HOURS : DATA.HUT_HOURS);

  if (project.work >= requiredHours) {
    const finalTile = project.target || (project.type === 'shed' ? T.shed : project.type === 'well' ? T.well : project.type === 'bridge' ? T.bridge : T.hut);
    setTile(sim, targetTile, finalTile);
    sim.projects.delete(targetTile);
    journal(sim, `${sim.pname[personId]} completed the ${project.type || 'project'}.`);
  }
  return { min: DATA.ACT_MIN.build, act: ACT.build };
}

function regrowOk(sim, tileIndex) {
  const x = tileIndex % sim.W;
  const y = (tileIndex / sim.W) | 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= sim.W || ny >= sim.H) return false;
      if ((dx || dy) && DATA.TILE_WALK[sim.tiles[idx(sim, nx, ny)]] !== 1) return false;
    }
  }
  return true;
}

function ruleLand(sim) {
  const dayOfYear = doyOf(sim.time);
  const totalTiles = sim.W * sim.H;

  for (let i = 0; i < sim.psoil.length; i++) {
    sim.psoil[i] = Math.min(1.2, sim.psoil[i] + 0.15 / 360);
  }

  if (dayOfYear === 101) ensureConnected(sim);

  for (let i = 0; i < totalTiles; i++) {
    const tile = sim.tiles[i];
    if (tile === T.crop) {
      const days = (sim.time - sim.tstate[i]) / 1440;
      if (!growing(sim.time) && days < 30) {
        setTile(sim, i, T.tilled);
        continue;
      }
      if (days >= DATA.CROP.growDays) setTile(sim, i, T.ripe);
      if (dayOfYear === 330) setTile(sim, i, T.tilled);
    } else if (tile === T.ripe && dayOfYear === 330) {
      setTile(sim, i, T.tilled);
    } else if (tile === T.hut && dayOfYear === 330) {
      for (let k = 0; k < sim.tn; k++) {
        if (sim.tholderKind[k] === 2 && sim.tholder[k] === i && sim.tstuff[k] === 'berries') {
          setQty(sim, k, (sim.tqty[k] * 0.2) | 0);
        }
      }
    } else if (tile === T.tree) {
      if (sim.tstate[i] < 0) sim.tstate[i] += 1;
      else sim.tstate[i] += 1 / 360;
    } else if (tile === T.grass && dayOfYear === 100 && sim.rng() < 0.002 && regrowOk(sim, i)) {
      setTile(sim, i, T.tree);
      sim.tstate[i] = 0;
    } else if (tile === T.tilled && dayOfYear === 1 && sim.rng() < 0.05) {
      setTile(sim, i, T.grass);
    }
  }
}

function rulePairing(sim) {
  for (let a = 0; a < sim.pn; a++) {
    if (!sim.palive[a] || sim.ppartner[a] >= 0 || ageYears(sim, a) < 16) continue;
    for (let b = a + 1; b < sim.pn; b++) {
      if (!sim.palive[b] || sim.ppartner[b] >= 0 || ageYears(sim, b) < 16) continue;
      if (sim.phome[a] === sim.phome[b] && sim.pmother[a] >= 0 && sim.pmother[a] === sim.pmother[b]) continue;
      if (regardOf(sim, a, b) < DATA.PAIR_REGARD || regardOf(sim, b, a) < DATA.PAIR_REGARD) continue;

      sim.ppartner[a] = b;
      sim.ppartner[b] = a;
      sim.pairings++;

      const roofA = sim.tiles[sim.phome[a]] === T.hut;
      const home = roofA ? sim.phome[a] : (sim.tiles[sim.phome[b]] === T.hut ? sim.phome[b] : sim.phome[a]);
      const mover = home === sim.phome[a] ? b : a;
      const leftMembers = household(sim, sim.phome[mover]).filter(q => q !== mover && ageYears(sim, q) >= DATA.ADULT_YEARS);

      if (!leftMembers.length && sim.tiles[sim.phome[mover]] === T.hut) {
        sim.ppartner[a] = -1;
        sim.ppartner[b] = -1;
        sim.pairings--;
        continue;
      }

      sim.phome[mover] = home;
      journal(sim, `${sim.pname[a]} and ${sim.pname[b]} made a household together.`);
      regardShift(sim, a, b, 20);
      regardShift(sim, b, a, 20);
      return;
    }
  }
}

function ruleBirths(sim) {
  for (let mother = 0; mother < sim.pn; mother++) {
    if (!sim.palive[mother]) continue;
    const partner = sim.ppartner[mother];
    if (partner < 0 || !sim.palive[partner]) continue;

    const age = ageYears(sim, mother);
    if (age < DATA.FERTILE_YEARS[0] || age > DATA.FERTILE_YEARS[1]) continue;
    if (mother > partner) continue;
    if (sim.time - sim.plastBirth[mother] < 2 * DATA.DAYS_PER_YEAR * 1440) continue;

    const home = sim.phome[mother];
    if (home < 0 || sim.tiles[home] !== T.hut) continue;
    const members = household(sim, home);
    const grainStock = count(sim, 2, home, 'grain');
    if (grainStock < members.length * 400) continue;
    if (sim.rng() > 0.006) continue;

    const usedNames = new Set(sim.pname);
    const availableNames = DATA.NAMES.filter(n => !usedNames.has(n));
    const childName = availableNames.length ? sim.rng.pick(availableNames) : 'Wend' + sim.pn;

    const child = addPerson(sim, { name: childName, x: sim.px[mother], y: sim.py[mother], age: 0, home });
    sim.pmother[child] = mother;
    sim.plastBirth[mother] = sim.time;
    sim.births++;

    for (const kin of members) {
      regardShift(sim, child, kin, 50);
      regardShift(sim, kin, child, 50);
    }
    journal(sim, `${sim.pname[mother]} bore a child, ${childName}.`);
  }
}

function ruleArrivals(sim) {
  if (sim.pn >= 40 || sim.households.length >= 6) return;
  const dayOfYear = doyOf(sim.time);
  if (dayOfYear < 50 || dayOfYear > 110) return;

  const settledHuts = sim.households.filter(h => sim.tiles[h.home] === T.hut);
  if (!settledHuts.length) return;
  if (sim.rng() > 0.035 * settledHuts.length) return;

  const seedHome = settledHuts[0].home;
  const newHome = findClaim(sim, seedHome % sim.W, (seedHome / sim.W) | 0);
  if (newHome < 0) return;

  sim.households.push({ home: newHome, founded: sim.time });
  const hx = newHome % sim.W;
  const hy = (newHome / sim.W) | 0;
  const usedNames = new Set(sim.pname);
  const pickName = () => {
    const available = DATA.NAMES.filter(n => !usedNames.has(n));
    const chosen = available.length ? sim.rng.pick(available) : 'Wend' + sim.pn;
    usedNames.add(chosen);
    return chosen;
  };

  const a = addPerson(sim, { name: pickName(), x: hx - 1, y: hy, age: 22 + sim.rng.int(14), home: newHome });
  const b = addPerson(sim, { name: pickName(), x: Math.min(sim.W - 1, hx + 1), y: hy, age: 20 + sim.rng.int(14), home: newHome });

  addThing(sim, { stuff: 'axe', holder: a, holderKind: 1 });
  addThing(sim, { stuff: 'knife', holder: b, holderKind: 1 });
  addThing(sim, { stuff: 'spade', holder: b, holderKind: 1 });
  addThing(sim, { stuff: 'grain', qty: 700 + sim.rng.int(300), holder: newHome, holderKind: 2 });
  addThing(sim, { stuff: 'penny', qty: 30 + sim.rng.int(40), holder: a, holderKind: 1 });

  journal(sim, `${sim.pname[a]} and ${sim.pname[b]} came to the ford and staked a claim.`);
}

function ruleDay(sim) {
  sim.bad.clear();
  sim.season = season(sim.time);
  ruleArrivals(sim);
  rulePairing(sim);
  ruleBirths(sim);

  for (let p = 0; p < sim.pn; p++) {
    if (!sim.palive[p]) continue;
    sim.phours[p] = DATA.HOURS_PER_DAY;
    if (sim.pneeds[p * 5 + 2] <= 0) sim.pexposed[p]++;
    else sim.pexposed[p] = 0;

    if (!sim.immortal) {
      if (sim.pexposed[p] >= 3) {
        die(sim, p, 'exposure', `${sim.pname[p]} died of the cold.`);
        continue;
      }
      const age = ageYears(sim, p);
      if (age > DATA.OLD_YEARS && sim.rng() < (age - DATA.OLD_YEARS) / 15 / 360) {
        die(sim, p, 'age', `${sim.pname[p]} died, old.`);
      }
    }
  }
}

function die(sim, personId, cause, text) {
  sim.palive[personId] = 0;
  clearSpatialOccupant(sim, personId, sim.px[personId], sim.py[personId]);
  sim.deaths[cause]++;
  journal(sim, text);

  const here = idx(sim, sim.px[personId], sim.py[personId]);
  const home = sim.phome[personId];
  const heirs = home >= 0 ? household(sim, home) : [];

  for (let t = 0; t < sim.tn; t++) {
    if (sim.tholderKind[t] === 1 && sim.tholder[t] === personId && sim.tqty[t] > 0) {
      setHolder(sim, t, 2, heirs.length && home >= 0 ? home : here);
    }
  }

  const partner = sim.ppartner[personId];
  if (partner >= 0) {
    sim.ppartner[partner] = -1;
    sim.ppartner[personId] = -1;
  }

  if (home >= 0 && heirs.length === 0) {
    const hIdx = sim.households.findIndex(h => h.home === home);
    if (hIdx >= 0) {
      sim.households.splice(hIdx, 1);
      journal(sim, 'The claim stands empty.');
    }
  }
  if (sim.onDeath) sim.onDeath(personId, cause, text);
}


// ============================================================================
// ==== 7. MIN-HEAP DISPATCH & THE 4 VERBS INTERFACE ====
// ============================================================================

function dispatch(sim, event) {
  const personId = event.a;
  switch (event.k) {
    case 'day':
      ruleDay(sim);
      sim.heap.push(sim.time + 1440, event);
      return;
    case 'land':
      ruleLand(sim);
      sim.heap.push(sim.time + 1440, event);
      return;
    case 'needs': {
      if (!sim.palive[personId]) return;
      ruleNeeds(sim, personId, 60);
      sim.heap.push(sim.time + 60, event);
      if (sim.pneeds[personId * 5] <= 0 && !sim.immortal) {
        die(sim, personId, 'starved', `${sim.pname[personId]} starved.`);
      }
      return;
    }
    case 'plan': {
      if (!sim.palive[personId] || event.seq !== sim.pplanSeq[personId]) return;
      const intent = plan(sim, personId);
      let dt = 0.1;
      let actType = ACT.idle;

      if (intent) {
        if (intent.k === 'move') {
          dt = ruleMove(sim, personId, intent.d) || 0.05;
          actType = ACT.walk;
        } else if (intent.k === 'go') {
          dt = ruleGo(sim, personId, intent.to);
          if (!dt) {
            if (intent.for >= 0) sim.bad.add(intent.for);
            dt = 1;
          }
          actType = ACT.walk;
        } else if (intent.k === 'act') {
          const chosen = chooseAct(sim, personId, intent.slot, intent.target ?? -1, intent.act);
          if (chosen) {
            dt = Math.max(0.05, DATA.ACT_MIN[chosen.act] ?? 0.5);
            actType = ACT[chosen.act] ?? ACT.idle;
            sim.heap.push(sim.time + dt, { k: 'do', a: personId, ti: chosen.ti, act: chosen.act, slot: chosen.slot, seq: sim.pplanSeq[personId] });
          } else {
            dt = 0.05;
          }
        } else if (intent.k === 'take') {
          moveThing(sim, intent.t, personId, 1, intent.qty);
          dt = 1;
        } else if (intent.k === 'store') {
          if (sim.phome[personId] >= 0) moveThing(sim, intent.t, sim.phome[personId], 2);
          dt = 1;
          actType = ACT.store;
        } else if (intent.k === 'wait') {
          dt = intent.min;
          actType = intent.act ?? ACT.idle;
        } else if (intent.k === 'sleep') {
          const minute = sim.time % 1440;
          const rate = 100 / 480;
          const nightSpan = minute < 300 ? 300 - minute : minute >= 1200 ? 1740 - minute : 0;
          dt = nightSpan || Math.min(480, Math.max(60, (100 - sim.pneeds[personId * 5 + 1]) / rate));
          const inside = sim.tiles[idx(sim, sim.px[personId], sim.py[personId])] === T.hut;

          sim.pneeds[personId * 5 + 1] = Math.min(100, sim.pneeds[personId * 5 + 1] + dt * rate);
          if (nightSpan) sim.phours[personId] = DATA.HOURS_PER_DAY;
          if (inside) sim.pneeds[personId * 5 + 2] = 100;
          actType = ACT.sleep;
          if (sim.onSleep) sim.onSleep(personId, dt);
        } else if (intent.k === 'face') {
          sim.pface[personId] = intent.d;
          dt = 0.01;
        }

        if (actType !== ACT.idle && actType !== ACT.sleep) {
          sim.phours[personId] -= dt / 60;
          sim.hoursByAct[actType] += dt / 60;
        }
      } else if (sim.pplanner[personId] === 1) {
        dt = 0.05;
      }

      sim.pact[personId] = actType;
      sim.pactStart[personId] = sim.time;
      sim.pbusyUntil[personId] = sim.time + dt;
      sim.heap.push(sim.time + dt, event);
      return;
    }
    case 'do': {
      if (!sim.palive[personId] || event.seq !== sim.pplanSeq[personId]) return;
      const result = applyAct(sim, personId, event.ti, { act: event.act, slot: event.slot });
      if (result.ev) sim.heap.push(sim.time, result.ev);
      if (result.open && sim.onOpen) sim.onOpen(personId, result);
      return;
    }
    case 'meet': {
      if (!sim.palive[event.b] || personId === event.b) return;
      sim.pneeds[personId * 5 + 4] = Math.min(100, sim.pneeds[personId * 5 + 4] + 10);
      sim.pneeds[event.b * 5 + 4] = Math.min(100, sim.pneeds[event.b * 5 + 4] + 10);
      regardShift(sim, personId, event.b, 2);
      regardShift(sim, event.b, personId, 2);

      // Social Gossip: propagate reputation of criminals / hostiles
      if (sim.regard[personId] && sim.regard[event.b]) {
        for (const targetIdStr in sim.regard[personId]) {
          const targetId = Number(targetIdStr);
          const opinion = sim.regard[personId][targetId];
          if (opinion <= -30 && regardOf(sim, event.b, personId) > 15) {
            regardShift(sim, event.b, targetId, -15);
          }
        }
        for (const targetIdStr in sim.regard[event.b]) {
          const targetId = Number(targetIdStr);
          const opinion = sim.regard[event.b][targetId];
          if (opinion <= -30 && regardOf(sim, personId, event.b) > 15) {
            regardShift(sim, personId, targetId, -15);
          }
        }
      }

      // Social Gossip: propagate price beliefs on meeting
      if (sim.belief[personId] && sim.belief[event.b]) {
        for (const stuff of Object.keys(sim.belief[personId])) {
          if (sim.belief[event.b][stuff] !== undefined) {
            const avg = (sim.belief[personId][stuff] + sim.belief[event.b][stuff]) / 2;
            sim.belief[personId][stuff] = sim.belief[personId][stuff] * 0.8 + avg * 0.2;
            sim.belief[event.b][stuff] = sim.belief[event.b][stuff] * 0.8 + avg * 0.2;
          }
        }
      }

      dealLoop: for (const [seller, buyer] of [[personId, event.b], [event.b, personId]]) {
        for (const t of hands(sim, seller)) {
          const stuff = sim.tstuff[t];
          if (stuff === 'penny' || sim.tqty[t] < 1) continue;
          const offerQty = Math.min(20, sim.tqty[t]);
          const offer = tradeOffer(sim, seller, buyer, stuff, offerQty);
          if (offer.ok) {
            doTrade(sim, seller, buyer, stuff, offerQty, offer.ask);
            break dealLoop;
          }
        }
        const sHome = sim.phome[seller];
        if (sHome >= 0 && count(sim, 2, sHome, 'grain') > 500 && count(sim, 1, buyer, 'penny') >= 2) {
          const offer = tradeOffer(sim, seller, buyer, 'grain', 20);
          if (offer.ok && count(sim, 2, sHome, 'grain') >= 20) {
            const grainThing = held(sim, 2, sHome, 'grain');
            if (grainThing >= 0) {
              moveThing(sim, grainThing, seller, 1, 20);
              doTrade(sim, seller, buyer, 'grain', 20, offer.ask);
              break dealLoop;
            }
          }
        }
      }
      return;
    }
  }
}

// 1. Verb: step(untilTime)
function step(sim, untilTime) {
  while (sim.heap.size && sim.heap.peekTime() <= untilTime) {
    const nextTime = sim.heap.peekTime();
    sim.time = nextTime;
    const event = sim.heap.pop();
    sim.events++;
    dispatch(sim, event);
  }
  sim.time = untilTime;
}

// Cancel ongoing action
function cancelAct(sim, personId) {
  sim.pplanSeq[personId]++;
  sim.pbusyUntil[personId] = sim.time;
  sim.pact[personId] = ACT.idle;
  sim.heap.push(sim.time, { k: 'plan', a: personId, seq: sim.pplanSeq[personId] });
}

// 2. Verb: inject(personId, intent)
function inject(sim, personId, intent) {
  if (intent.k === 'become') {
    if (intent.target >= 0 && sim.palive[intent.target]) {
      sim.pplanner[personId] = 0;
      sim.pplanner[intent.target] = 1;
      return intent.target;
    }
    return personId;
  }
  if (intent.k === 'hold') {
    sim.pheld[personId] = intent.d;
    cancelAct(sim, personId);
    return;
  }
  if (intent.k === 'release') {
    if (intent.d === undefined || sim.pheld[personId] === intent.d) sim.pheld[personId] = -1;
    return;
  }
  cancelAct(sim, personId);
  sim.pintent[personId].push(intent);
}

// 3. Verb: read(view)
function read(sim, query) {
  if (query === 'hot') {
    return { n: sim.pn, x: sim.px, y: sim.py, face: sim.pface, alive: sim.palive, act: sim.pact, busyUntil: sim.pbusyUntil, time: sim.time };
  }
  if (query === 'metrics') {
    let livingPop = 0;
    let totalGrain = 0;
    let tilledFields = 0;
    let standingHuts = 0;
    for (let p = 0; p < sim.pn; p++) if (sim.palive[p]) livingPop++;
    for (let t = 0; t < sim.tn; t++) if (sim.tqty[t] > 0 && sim.tstuff[t] === 'grain') totalGrain += sim.tqty[t];
    for (let i = 0; i < sim.tiles.length; i++) {
      if (sim.tiles[i] === T.tilled || sim.tiles[i] === T.crop || sim.tiles[i] === T.ripe) tilledFields++;
      if (sim.tiles[i] === T.hut) standingHuts++;
    }
    return {
      time: sim.time, day: dayOf(sim.time), year: yearOf(sim.time),
      pop: livingPop, grain: totalGrain, fields: tilledFields, huts: standingHuts,
      households: sim.households.length, trades: sim.trades, tradeValue: sim.tradeValue,
      deaths: Object.assign({}, sim.deaths), hours: Array.from(sim.hoursByAct),
      rain: sim.rain[yearOf(sim.time)] || 1
    };
  }
  if (query === 'directory' || query.directory) {
    const list = [];
    const focusPerson = query.focus !== undefined ? query.focus : (query.person !== undefined ? query.person : -1);
    for (let p = 0; p < sim.pn; p++) {
      if (!sim.palive[p]) continue;
      const b = p * 5;
      const inventory = hands(sim, p).map(t => ({ id: t, name: DATA.STUFF[sim.tstuff[t]].name, qty: sim.tqty[t], kind: DATA.STUFF[sim.tstuff[t]].kind }));
      let relationBadge = '';
      if (focusPerson >= 0 && focusPerson !== p) {
        const r = regardOf(sim, p, focusPerson);
        const k = getKinshipRelation(sim, focusPerson, p);
        if (k) relationBadge = `[${k} +${r}]`;
        else if (r >= 50) relationBadge = `[Kin +${r}]`;
        else if (r >= 30) relationBadge = `[Friend +${r}]`;
        else if (r >= 10) relationBadge = `[Acquaintance +${r}]`;
        else if (r <= -30) relationBadge = `[Enemy ${r}]`;
        else if (r < 0) relationBadge = `[Distrusted ${r}]`;
        else relationBadge = `[Stranger 0]`;
      }
      list.push({
        id: p,
        name: sim.pname[p],
        age: ageYears(sim, p) | 0,
        kind: sim.pkind[p],
        kindName: sim.pkind[p] > 0 ? DATA.BEASTS[sim.pkind[p]] : 'Villager',
        x: sim.px[p],
        y: sim.py[p],
        act: DATA.ACTS[sim.pact[p]] || 'idle',
        needs: Array.from(sim.pneeds.slice(b, b + 5)),
        hands: inventory,
        home: sim.phome[p],
        planner: sim.pplanner[p],
        relationBadge
      });
    }
    return list;
  }
  if (query.person !== undefined && query.acts === undefined && query.inspect === undefined) {
    const p = query.person;
    const b = p * 5;
    const inventory = hands(sim, p).map(t => ({ id: t, name: DATA.STUFF[sim.tstuff[t]].name, qty: sim.tqty[t], kind: DATA.STUFF[sim.tstuff[t]].kind }));
    return {
      name: sim.pname[p], alive: sim.palive[p], age: ageYears(sim, p) | 0,
      needs: Array.from(sim.pneeds.slice(b, b + 5)), hours: sim.phours[p],
      act: DATA.ACTS[sim.pact[p]], hands: inventory, x: sim.px[p], y: sim.py[p],
      face: sim.pface[p], home: sim.phome[p],
      skills: sim.pskills ? Array.from(sim.pskills.slice(p * 12, (p + 1) * 12)) : [],
      wounds: sim.pwounds ? Array.from(sim.pwounds.slice(p * 6, (p + 1) * 6)) : []
    };
  }
  if (query.acts !== undefined) {
    const p = query.acts;
    const fx = sim.px[p] + DIRS[sim.pface[p]][0];
    const fy = sim.py[p] + DIRS[sim.pface[p]][1];
    const facingTile = (fx >= 0 && fy >= 0 && fx < sim.W && fy < sim.H) ? idx(sim, fx, fy) : idx(sim, sim.px[p], sim.py[p]);
    const hereTile = idx(sim, sim.px[p], sim.py[p]);
    const facingList = affordances(sim, p, facingTile, query.slot);
    const underfootList = affordances(sim, p, hereTile, query.slot);

    const underfootPriority = underfootList.filter(a => a.act === 'take' || a.act === 'enter' || a.act === 'eat' || a.act === 'drink');
    const facingNonInspect = facingList.filter(a => a.act !== 'inspect');
    const underfootRemaining = underfootList.filter(a => !underfootPriority.includes(a) && a.act !== 'inspect');
    const inspects = [...facingList.filter(a => a.act === 'inspect'), ...underfootList.filter(a => a.act === 'inspect')];

    const merged = [];
    const pushUnique = (a) => {
      if (!merged.some(m => m.act === a.act && m.tile === a.tile && m.slot === a.slot)) merged.push(a);
    };

    underfootPriority.forEach(pushUnique);
    facingNonInspect.forEach(pushUnique);
    underfootRemaining.forEach(pushUnique);
    inspects.forEach(pushUnique);

    return merged;
  }
  if (query.site !== undefined) {
    const items = [];
    for (let t = 0; t < sim.tn; t++) {
      if (sim.tholderKind[t] === 2 && sim.tholder[t] === query.site && sim.tqty[t] > 0) {
        items.push({ id: t, name: DATA.STUFF[sim.tstuff[t]].name, qty: sim.tqty[t] });
      }
    }
    return items;
  }
  if (query.inspect !== undefined) {
    return describe(sim, query.person ?? -1, query.inspect);
  }
  return null;
}

// 4. Verb: hash()
function hash(sim) {
  let h = 0x811c9dc5;
  h = fnv(h, sim.time | 0);
  h = fnv(h, sim.pn);
  h = hashArray(h, sim.px.subarray(0, sim.pn));
  h = hashArray(h, sim.py.subarray(0, sim.pn));
  h = hashArray(h, sim.palive.subarray(0, sim.pn));
  h = hashArray(h, sim.pneeds.subarray(0, sim.pn * 5));
  h = hashArray(h, sim.pskills.subarray(0, sim.pn * 12));
  h = hashArray(h, sim.pwounds.subarray(0, sim.pn * 6));
  h = hashArray(h, sim.pkind.subarray(0, sim.pn));
  h = fnv(h, sim.tn);
  h = hashArray(h, sim.tqty.subarray(0, sim.tn));
  h = hashArray(h, sim.tholder.subarray(0, sim.tn));
  h = hashArray(h, sim.tholderKind.subarray(0, sim.tn));
  h = hashArray(h, sim.tiles);
  return h >>> 0;
}


// ============================================================================
// ==== 8. WORLDGEN, BIOMES & INITIALIZATION ====
// ============================================================================

function makeWorld(seed, withPlayer = true, opts = {}) {
  const sim = createSim(seed, opts);
  const road = sim.H >> 1;
  let home = -1;

  for (let x = Math.floor(sim.W * 0.6); x > 10 && home < 0; x--) {
    for (let y = road - 3; y <= road + 3; y++) {
      if (sim.tiles[idx(sim, x, y)] === T.grass && sim.tiles[idx(sim, x + 1, y)] === T.grass) {
        home = idx(sim, x, y);
        break;
      }
    }
  }

  const hx = home % sim.W;
  const hy = (home / sim.W) | 0;
  sim.households.push({ home, founded: sim.time });

  const fam = [
    addPerson(sim, { name: 'Hal', x: hx - 1, y: hy, age: 30, home }),
    addPerson(sim, { name: 'Edda', x: hx + 1, y: hy, age: 28, home }),
    addPerson(sim, { name: 'Tam', x: hx, y: hy + 1, age: 6, home })
  ];

  addThing(sim, { stuff: 'axe', holder: fam[0], holderKind: 1 });
  addThing(sim, { stuff: 'spade', holder: fam[1], holderKind: 1 });
  addThing(sim, { stuff: 'knife', holder: fam[1], holderKind: 1 });
  addThing(sim, { stuff: 'grain', qty: opts.startGrain ?? 1000, holder: home, holderKind: 2 });

  journal(sim, 'Hal and Edda came up the road with a cart, an axe, a spade and a sack of seed grain, and stopped by the stream.');

  let player = -1;
  if (withPlayer) {
    player = addPerson(sim, { name: 'You', x: 2, y: road, planner: 1 });
    addThing(sim, { stuff: 'knife', holder: player, holderKind: 1 });
    addThing(sim, { stuff: 'axe', holder: player, holderKind: 1 });
    addThing(sim, { stuff: 'waterskin', holder: player, holderKind: 1 });
    addThing(sim, { stuff: 'bread', qty: 1, holder: player, holderKind: 1 });
    addThing(sim, { stuff: 'penny', qty: 5, holder: player, holderKind: 1 });
    addThing(sim, { stuff: 'bread', qty: 1, holder: idx(sim, 6, road), holderKind: 2 });
    journal(sim, 'You arrive on the road with an axe, a knife, a waterskin, a loaf and five pennies.');
  }
  return { S: sim, player, home };
}

function getBiome(elevation, moisture, temperature) {
  if (temperature < 0.25) return { id: 'tundra', name: 'Tundra', primaryMat: 'stone', treeDensity: 0.05 };
  if (moisture > 0.8 && elevation < 0.3) return { id: 'marsh', name: 'Marshland', primaryMat: 'thatch', treeDensity: 0.1 };
  if (moisture < 0.25) return { id: 'arid', name: 'Arid Shrubland', primaryMat: 'clay', treeDensity: 0.02 };
  if (moisture > 0.45) return { id: 'forest', name: 'Temperate Forest', primaryMat: 'timber', treeDensity: 0.25 };
  return { id: 'grassland', name: 'Grassland', primaryMat: 'timber', treeDensity: 0.1 };
}

function generateWorldChunk(seed, cx, cy) {
  const chunk = new Uint8Array(32 * 32);
  const elev = 0.5 + 0.3 * Math.sin(cx * 0.1 + cy * 0.15);
  const moist = 0.5 + 0.3 * Math.cos(cx * 0.15 - cy * 0.1);
  const temp = 0.5 + 0.2 * Math.sin(cy * 0.05);
  const biome = getBiome(elev, moist, temp);

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const i = y * 32 + x;
      const wx = cx * 32 + x;
      const wy = cy * 32 + y;
      let t = T.grass;
      const isRiver = Math.abs(wx - (115 + Math.sin(wy * 0.15) * 3 | 0)) < 1.5;
      if (isRiver) {
        t = (wy === 48) ? T.ford : T.stream;
      } else if (wy === 48) {
        t = T.path;
      } else {
        const rVal = ((Math.sin(wx * 12.9898 + wy * 78.233) * 43758.5453) % 1 + 1) % 1;
        if (rVal < biome.treeDensity) t = T.tree;
      }
      chunk[i] = t;
    }
  }
  return chunk;
}

function makeWorldWanderer(seed, prerollYears = 40) {
  const { S } = makeWorld(seed, false);
  const YEAR = DATA.DAYS_PER_YEAR * 1440;
  step(S, S.time + prerollYears * YEAR);

  const roadY = S.H >> 1;
  const player = addPerson(S, { name: 'You', x: 2, y: roadY, planner: 1, age: 24 });
  addThing(S, { stuff: 'axe', holder: player, holderKind: 1 });
  addThing(S, { stuff: 'knife', holder: player, holderKind: 1 });
  addThing(S, { stuff: 'waterskin', holder: player, holderKind: 1 });
  addThing(S, { stuff: 'bread', qty: 2, holder: player, holderKind: 1 });
  addThing(S, { stuff: 'penny', qty: 10, holder: player, holderKind: 1 });

  journal(S, `After 40 years, a wanderer arrives on the road from the west.`);
  return { S, player };
}

function saveState(sim) {
  return JSON.stringify({
    time: sim.time,
    pn: sim.pn,
    tn: sim.tn,
    px: Array.from(sim.px.subarray(0, sim.pn)),
    py: Array.from(sim.py.subarray(0, sim.pn)),
    pface: Array.from(sim.pface.subarray(0, sim.pn)),
    palive: Array.from(sim.palive.subarray(0, sim.pn)),
    pplanner: Array.from(sim.pplanner.subarray(0, sim.pn)),
    pbirth: Array.from(sim.pbirth.subarray(0, sim.pn)),
    pneeds: Array.from(sim.pneeds.subarray(0, sim.pn * 5)),
    pskills: Array.from(sim.pskills.subarray(0, sim.pn * 12)),
    pocc: Array.from(sim.pocc.subarray(0, sim.pn)),
    pkind: Array.from(sim.pkind.subarray(0, sim.pn)),
    pwounds: Array.from(sim.pwounds.subarray(0, sim.pn * 6)),
    pfollow: Array.from(sim.pfollow.subarray(0, sim.pn)),
    ppartner: Array.from(sim.ppartner.subarray(0, sim.pn)),
    pmother: Array.from(sim.pmother.subarray(0, sim.pn)),
    phome: Array.from(sim.phome.subarray(0, sim.pn)),
    penemy: sim.penemy ? Array.from(sim.penemy.subarray(0, sim.pn)) : [],
    pname: sim.pname.slice(0, sim.pn),
    regard: sim.regard.slice(0, sim.pn),
    belief: sim.belief.slice(0, sim.pn),
    households: sim.households,
    debt: Array.from(sim.debt.entries()),
    board: sim.board,
    projects: Array.from(sim.projects.entries()),
    tqty: Array.from(sim.tqty.subarray(0, sim.tn)),
    tstuff: sim.tstuff.slice(0, sim.tn),
    twear: Array.from(sim.twear.subarray(0, sim.tn)),
    tholder: Array.from(sim.tholder.subarray(0, sim.tn)),
    tholderKind: Array.from(sim.tholderKind.subarray(0, sim.tn)),
    tiles: Array.from(sim.tiles),
    tstate: Array.from(sim.tstate),
    hearths: Array.from(sim.hearths.entries()),
    rain: sim.rain,
    trades: sim.trades,
    tradeValue: sim.tradeValue,
    deaths: sim.deaths
  });
}

function loadState(simOrJson, maybeJson) {
  const jsonString = typeof simOrJson === 'string' ? simOrJson : maybeJson;
  const data = JSON.parse(jsonString);
  const sim = (typeof simOrJson === 'object' && simOrJson !== null) ? simOrJson : createSim(1);
  sim.time = data.time;
  sim.pn = data.pn;
  sim.tn = data.tn;
  sim.px.set(data.px);
  sim.py.set(data.py);
  if (data.pface) sim.pface.set(data.pface);
  sim.palive.set(data.palive);
  if (data.pplanner) sim.pplanner.set(data.pplanner);
  if (data.pbirth) sim.pbirth.set(data.pbirth);
  sim.pneeds.set(data.pneeds);
  if (data.pskills) sim.pskills.set(data.pskills);
  if (data.pocc) sim.pocc.set(data.pocc);
  if (data.pkind) sim.pkind.set(data.pkind);
  if (data.pwounds) sim.pwounds.set(data.pwounds);
  if (data.pfollow) sim.pfollow.set(data.pfollow);
  if (data.ppartner) sim.ppartner.set(data.ppartner);
  if (data.pmother) sim.pmother.set(data.pmother);
  if (data.phome) sim.phome.set(data.phome);
  if (data.penemy && sim.penemy) sim.penemy.set(data.penemy);
  if (data.pname) sim.pname = data.pname;
  if (data.regard) sim.regard = data.regard;
  if (data.belief) sim.belief = data.belief;
  if (data.households) sim.households = data.households;
  if (data.debt) sim.debt = new Map(data.debt);
  if (data.board) sim.board = data.board;
  if (data.projects) sim.projects = new Map(data.projects);
  if (data.hearths) sim.hearths = new Map(data.hearths);
  sim.tqty.set(data.tqty);
  sim.tstuff = data.tstuff;
  if (data.twear) sim.twear.set(data.twear);
  sim.tholder.set(data.tholder);
  sim.tholderKind.set(data.tholderKind);
  sim.tiles.set(data.tiles);
  if (data.tstate) sim.tstate.set(data.tstate);
  if (data.rain) sim.rain = data.rain;
  if (data.trades !== undefined) sim.trades = data.trades;
  if (data.tradeValue !== undefined) sim.tradeValue = data.tradeValue;
  if (data.deaths) sim.deaths = Object.assign({}, data.deaths);

  sim.stock.clear();
  for (let t = 0; t < sim.tn; t++) {
    if (sim.tqty[t] > 0) stockAdd(sim, t, sim.tqty[t]);
  }

  if (sim.pgrid) {
    sim.pgrid.fill(0);
    for (let p = 0; p < sim.pn; p++) {
      if (sim.palive[p]) {
        sim.pgrid[sim.py[p] * sim.W + sim.px[p]] = p + 1;
      }
    }
  }

  return sim;
}

export {
  DATA, T, ACT, DIRS, MAX_PERSONS, MAX_THINGS, MAX_PERSONS as MAXP, MAX_THINGS as MAXT,
  makeRng, Heap, fnv, hashArray, dayOf, yearOf, doyOf, season, growing,
  createSim, idx, ensureConnected, setTile, tileAt, walkable, personAt, ageYears, addPerson,
  stockKey, stockOf, stockAdd, setQty, setHolder, addThing, held, hands, count, moveThing, journal,
  gainSkill, wearTool, regardShift, regardOf, sawPrice, worthTo, dealKey, tradeOffer, doTrade,
  pathLen, adjacentFree, nearestTile, nearestScan, countTiles, household, findClaim,
  hasLineOfSight, getKinshipRelation, checkAccessPermission, getHearth,
  plan, heuristic, goAct, ruleArrivals,
  ruleNeeds, ruleMove, ruleGo, affordances, tileName, describe, chooseAct, applyAct, ruleBuild, regrowOk, ruleLand, rulePairing, ruleBirths, ruleDay, die,
  dispatch, step, cancelAct, inject, read, hash,
  makeWorld, makeWorldWanderer, getBiome, generateWorldChunk, saveState, loadState
};

if (typeof window !== 'undefined') {
  window.simEngine = {
    DATA, T, ACT, DIRS, MAX_PERSONS, MAX_THINGS, MAXP: MAX_PERSONS, MAXT: MAX_THINGS,
    makeRng, Heap, fnv, hashArray, dayOf, yearOf, doyOf, season, growing,
    createSim, idx, ensureConnected, setTile, tileAt, walkable, personAt, ageYears, addPerson,
    stockKey, stockOf, stockAdd, setQty, setHolder, addThing, held, hands, count, moveThing, journal,
    gainSkill, wearTool, regardShift, regardOf, sawPrice, worthTo, dealKey, tradeOffer, doTrade,
    pathLen, adjacentFree, nearestTile, nearestScan, countTiles, household, findClaim,
    hasLineOfSight, getKinshipRelation, checkAccessPermission, getHearth,
    plan, heuristic, goAct, ruleArrivals,
    ruleNeeds, ruleMove, ruleGo, affordances, tileName, describe, chooseAct, applyAct, ruleBuild, regrowOk, ruleLand, rulePairing, ruleBirths, ruleDay, die,
    dispatch, step, cancelAct, inject, read, hash,
    makeWorld, makeWorldWanderer, getBiome, generateWorldChunk, saveState, loadState
  };
}
