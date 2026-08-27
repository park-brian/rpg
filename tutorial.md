# Ford Simulation Engine — Player & AI Playtesting Guide

Welcome to **Ford**, a deterministic discrete-event life and settlement simulation engine designed to run as a standalone single-file distribution (`index.html`) under a strict 6,000-line budget.

This guide details both the **interactive gameplay mechanics** for human players and the **programmatic interface** for autonomous AI playtesting agents that hook into the simulation's event pipeline, observe world state, and execute visible actions.

---

## 1. Core Architecture & Philosophy

```
+-------------------------------------------------------------------------+
|                        MIN-HEAP EVENT SCHEDULER                         |
|      step(untilTime)  --->  Dispatches prioritized simulation events     |
+------------------------------------+------------------------------------+
                                     |
    +--------------------------------+--------------------------------+
    |                                                                 |
+---v----------------------------+       +----------------------------v---+
|      PERSON STORE (SoA)        |       |       THING STORE (SoA)        |
|  Needs · Skills · Anatomy      |       |  Dual-Indexed Containers       |
|  NPCs · Player · Beasts        |       |  Tools · Resources · Buildings |
+--------------------------------+       +--------------------------------+
    |                                                                 |
    +--------------------------------+--------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                         FOUR VERBS INTERFACE                            |
|  1. step(untilTime)      2. inject(id, intent)                          |
|  3. read(view)           4. hash()                                      |
+-------------------------------------------------------------------------+
```

### The Four Verbs
All interactions in Ford adhere strictly to four primitive operations:
1. **`step(untilTime)`**: Advances the min-heap priority scheduler, running physical, economic, and social simulation events up to a specified simulation minute.
2. **`inject(personId, intent)`**: Queues player intents (`move`, `act`, `hold`, `release`, `wait`, `become`).
3. **`read(view)`**: Returns immutable, structured views of the world (`acts`, `person`, `inspect`, `site`, `metrics`, `hot`).
4. **`hash()`**: Computes a deterministic 32-bit FNV-1a hash of the entire world state to ensure replayability and verify consistency.

---

## 2. Controls & User Interface

### Desktop Controls
| Input Key | Function | Description |
| :--- | :--- | :--- |
| **W / A / S / D** or **Arrows** | Movement & Facing | Steps one tile North, West, South, or East. |
| **E** or **Space** | Primary Action | Executes the top contextual affordance for the selected tool/ground. |
| **R** (or hold **A** button) | Affordance Panel | Opens the full menu of all possible actions facing the current tile. |
| **Q** or **Escape** | Cancel / Back | Cancels current ongoing action span or closes open panels. |
| **1 – 7** | Select Tool Slot | Focuses an item in your hands strip (Axe, Knife, Bread, Coins, etc.). |
| **Menu Button (☰)** | System Menu | Inspect character sheet ("Me"), view journal, or adjust simulation speed. |

### Touch / Mobile Controls
- **D-Pad (Bottom-Left)**: Directional movement with hold-to-repeat support.
- **Button A (Bottom-Right)**: Tap to perform primary action; hold (350ms) to open the Affordance List.
- **Button B (Bottom-Right)**: Cancel action, unequip active tool, or close dialogs.
- **Hands Strip (Bottom)**: Tap any inventory slot to equip or unequip tools.

---

## 3. Needs, Survival & Bodily Health

Every living entity (player, villager, and beast) shares the same unified `Person` Struct-of-Arrays (SoA) layout.

```
                  +-------------------------------+
                  |      NEEDS HIERARCHY          |
                  |                               |
                  |  [1] Food     (Starvation)    |
                  |  [2] Warmth   (Exposure/Cold) |
                  |  [3] Sleep    (Fatigue)       |
                  |  [4] Safety   (Beasts/Combat) |
                  |  [5] Company  (Social ties)   |
                  +-------------------------------+
```

### 1. The Five Fundamental Needs
- **Food (0–100)**: Decays steadily. When depleted, causes starvation damage. Forage berries, gather thatch, grow crops, mill flour, and bake bread to replenish.
- **Warmth (0–100)**: Drops during winter, cold nights, or rain. Being near fires or inside sheltered huts/sheds restores warmth.
- **Sleep (0–100)**: Decreases through physical labour and waking hours. Rest on claims or inside huts to recover.
- **Safety (0–100)**: Decreases in the presence of predators or aggressive entities. Requires weapons or community defense.
- **Company (0–100)**: Improves through meeting neighbors, trading goods, and social gossip.

### 2. Anatomy & Injury System
- Entities have regional body parts: **Head**, **Torso**, **Arms**, and **Legs**.
- Combat and wild beast encounters inflict bleeding wounds.
- Bleeding reduces health over time unless treated with **cloth bandages** or **herbal poultices**.

---

## 4. Crafting, Agriculture & Construction

### Tool Progression & Affordances
Equipping a tool transforms your available actions (`read({acts: player, slot})`):

| Equipped Item | Target Tile / Entity | Available Actions (`act`) | Result |
| :--- | :--- | :--- | :--- |
| **Bare Hands** | Ground / Object / NPC | `inspect`, `talk`, `take`, `drop` | Examines tile, initiates dialogue, or picks up items. |
| **Knife** | Grass Tile (`T.grass`) | `thatch` | Cuts grass into thatch bundles for building roofs. |
| **Axe** | Tree Tile (`T.tree`) | `chop` | Fells tree into logs and clears land for farming. |
| **Knife + Log** | Inventory Log | `whittle` | Crafts wooden spade, shafts, or tool handles. |
| **Spade** | Grass Tile (`T.grass`) | `till` | Breaks sod into fertile tilled soil (`T.tilled`). |
| **Grain** | Tilled Tile (`T.tilled`)| `sow` | Plants crop seeds (`T.crop`) for seasonal growth. |
| **Sickle / Hands** | Ripe Tile (`T.ripe`) | `harvest` | Harvests grain bundles and seed stock. |
| **Grain + Quern** | Village Mill / Hut | `mill` | Grinds raw grain into baking flour. |
| **Flour + Oven** | Campfire / Oven | `bake` | Bakes wholesome bread loaves. |

### Settlement Construction Projects
Building structures requires staged assembly from physical parts:
1. **Huts (`T.hut`)**: Requires a Frame (`T.frame`), 4 Logs, and 4 Thatch. Provides permanent shelter, warmth, and storage.
2. **Storage Sheds (`T.shed`)**: Automatically constructed when grain surplus exceeds seasonal consumption. Protects crops from spoilage.
3. **Fences (`T.fence`)**: Protects tilled parcels and livestock from wild herbivores and predators.
4. **Public Works**: Collective village projects including the **Stone Bridge** at the ford and the **Community Well**.

---

## 5. Autonomous AI Playtesting Architecture

To playtest Ford programmatically as an autonomous single-player agent, you can hook directly into the simulation's API exposed on `window.sim` (in browser) or via CommonJS `require('./src/game.js')` (in Node.js).

```
+-------------------------------------------------------------------------+
|                       AI PLAYTEST AGENT LOOP                            |
|                                                                         |
|  1. OBSERVE   --->  read(S, {acts: player}) & read(S, {person: player}) |
|  2. EVALUATE  --->  Score needs (Food < 30? Warmth < 20? Danger?)       |
|  3. DECIDE    --->  Select optimal affordance or navigation vector      |
|  4. INJECT    --->  inject(S, player, {k: 'act', slot, act, target})    |
|  5. STEP      --->  step(S, S.time + deltaMinutes)                      |
|  6. VERIFY    --->  Assert invariants & capture visual canvas buffer     |
+-------------------------------------------------------------------------+
```

### 1. Perception & Diagnostic Hook (`window.sim.inspect()`)
In the live browser runtime or Playwright E2E tests, querying `window.sim.inspect()` returns a complete real-time perceptual snapshot:

```javascript
const info = await page.evaluate(() => window.sim.inspect());
console.log('Player Position:', info.player.x, info.player.y);
console.log('Needs (Food, Sleep, Warmth, Safety, Company):', info.player.needs);
console.log('Held Inventory Items:', info.player.held);
console.log('Available Contextual Affordances:', info.affordances);
console.log('Facing Tile Details:', info.facingTile);
console.log('Recent Journal Events:', info.journal);
```

### 2. Action & Decision Injection (`inject`)
```javascript
// Step towards a target direction (0: South, 1: North, 2: West, 3: East)
sim.inject(S, player, { k: 'move', d: 3 });

// Execute an affordance (e.g. chop tree or till ground)
sim.inject(S, player, {
  k: 'act',
  slot: axeSlotIndex,
  target: targetTileIndex,
  act: 'chop'
});

// Advance time to allow the action span to complete
sim.step(S, S.time + sim.DATA.ACT_MIN.chop);
```

### 3. Generational "Become" Hook
When the player entity dies or wishes to switch perspective to an heir or another villager:
```javascript
sim.inject(S, player, { k: 'become', target: heirPersonId });
sim.step(S, S.time + 1);
```

### 4. Continuous Invariant & Bug Detection Gates (`window.sim.checkInvariants()`)
An autonomous playtester asserts simulation integrity after every action:
```javascript
const invariants = await page.evaluate(() => window.sim.checkInvariants());
expect(invariants.ok).toBe(true);
expect(invariants.stockMismatches).toBe(0);
expect(invariants.deadActions).toBe(0);
```

Key invariants checked:
- **Conservation of Stock**: `count(S, kind, holder, stuff)` strictly matches the sum of active `tqty` across all containers.
- **No Ghost Execution**: Entities where `palive === 0` never receive event dispatches or execute actions.
- **Grid Connectivity**: No walkable tiles are ever isolated from the road network.
- **Affordance Parity**: Every action available to NPC heuristics is accessible by the player cursor.

---

## 6. Hash Routes & Exploration Modes

The application supports multiple hash-based execution modes for rapid testing and inspection:

- **`/#play`**: Full interactive game with WebGL2/Canvas rendering, touch D-pad, HUD, and live `window.sim.inspect()`.
- **`/#sim?years=20&seed=42`**: Headless multi-decade simulation dashboard featuring live population, grain, and land charts with a minimap.
- **`/#gen?seed=42`**: Macroscopic world generator inspector displaying 16x16 chunks (512x512 tiles) of procedural biomes, elevation, and river basins.
- **`/#test`**: In-browser automated TDD test suite validating all core engine gates.

---

## 7. Running Tests & Playtesting Scenarios

Run the complete test suite or targeted playtest scenarios:

```bash
# 1. Run all 41 fast unit and multi-year headless simulation tests
npm test

# 2. Run Playwright E2E browser tests with embedded screenshot assertions
npm run test:e2e

# 3. Run the autonomous single-player playtesting bot scenario
npm run test:playtest
```

