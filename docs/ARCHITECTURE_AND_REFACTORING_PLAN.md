# Ford Simulation Engine — Minimal & Cohesive Architecture Specification

## 1. Executive Summary & Design Principles

The goal of this architectural refactoring is to make the Ford simulation engine **extremely performant, low LOC, self-documenting, and effortless to understand** without fragmenting context across dozens of files.

### The Three Architectural Principles
1. **Zero Context Fragmentation (2-Layer Cohesion)**:
   - All simulation logic (data tables, SoA memory stores, event min-heap, pathfinding, AI heuristics, pure rules, and 4-verb API) lives in `src/sim.js`.
   - All rendering, UI input handling, HUD, modal panels, diagnostic telemetry, and dashboard routing live in `src/view.js`.
2. **Extreme Performance with Zero Hot-Loop Allocations**:
   - Contiguous Struct-of-Arrays (SoA) typed arrays (`Int16Array`, `Float32Array`, `Uint8Array`).
   - Constant-time $O(1)$ dual-indexed inventory map (`stockOf`, `setQty`, `setHolder`).
   - Deterministic min-heap priority scheduler (`Heap`) maintaining total `(time, seq)` ordering.
   - Simulation throughput target $\ge 40,000$ events/sec.
3. **Un-Golfed, Self-Documenting Clarity**:
   - Descriptive variable and parameter names (`personId`, `tileIndex`, `selectedSlot`, `quantity`, `sellerId`, `buyerId`).
   - Unrolled single-statement lines with clear section banners and JSDoc contracts.
   - 100% backward compatibility with all existing test suites.

---

## 2. File Organization

```
rpg/
├── src/
│   ├── sim.js         # Complete headless simulation kernel (~850 LOC)
│   ├── view.js        # Canvas renderer, UI, HUD, and dashboards (~450 LOC)
│   ├── game.js        # Aggregator re-export gateway (~30 LOC)
│   └── template.html  # Standalone HTML shell with styling (~68 LOC)
├── docs/
│   └── ARCHITECTURE_AND_REFACTORING_PLAN.md # This specification
├── tests/
│   ├── unit/          # 41 unit, integration, and multi-year simulation tests
│   └── e2e/           # Playwright specs & autonomous playtesting bot
├── build.js           # Fast zero-dependency bundler (<20ms)
├── tutorial.md        # Player & AI Playtesting guide
└── index.html         # Generated standalone distribution
```

---

## 3. Detailed Component Breakdown

### `src/sim.js` (The Simulation Kernel)
- **`DATA`**: Central constants table for items, tools, recipes, needs decay rates, tile walkability, colors, and occupations.
- **`Core`**:
  - `makeRng(seed)`: 32-bit xorshift PRNG with `.int(n)` and `.pick(array)`.
  - `Heap`: Min-heap on `(time, seq)` with binary percolation (`bubbleUp`, `sinkDown`).
  - `time`: Conversions `dayOf`, `yearOf`, `doyOf`, `season`, `growing`.
  - `hash`: FNV-1a 32-bit deterministic state checksum.
- **`State & Storage`**:
  - `createSim(seed, opts)` allocating contiguous typed arrays: `px`, `py`, `pface`, `palive`, `pneeds`, `pwounds`, `pskills`, `phours`, `pact`, `pbusyUntil`, `pplanner`.
  - `stockOf`, `setQty`, `setHolder`, `addThing`, `count`, `held`, `hands`, `moveThing`.
  - `idx`, `tileAt`, `walkable`, `ensureConnected`, `setTile`, `addPerson`, `household`.
- **`AI & Pathfinding`**:
  - `pathLen`: 0-1 BFS distance check with cached traversal buffer.
  - `adjacentFree`: Neighboring walkable tile search.
  - `nearestTile`: Circular ring search with memoization around household claims.
  - `plan` & `heuristic`: The unified NPC decision tree.
- **`Pure Rules`**:
  - `affordances`: Unified contextual action discovery table.
  - `describe`: Structured inspection generator.
  - `chooseAct` & `applyAct`: Action execution and state mutation.
  - `ruleNeeds`: Food, sleep, warmth decay with shelter benefits.
  - `ruleMove` & `ruleGo`: Travel spans and time costs.
  - `ruleLand`: Agricultural growth, tree regrowth, soil recovery.
  - `rulePairing`, `ruleBirths`, `die`: Generational social lifecycle.
  - `dispatch` & `step`: Min-heap event processing loop.
- **`Verbs & Worldgen`**:
  - `inject`, `read`, `hash`, `makeWorld`, `makeWorldWanderer`, `getBiome`, `generateWorldChunk`.

### `src/view.js` (The Renderer & UI System)
- **`makeRenderer(canvas)`**:
  - Viewport camera centering on focused entity.
  - Smooth animation interpolation along `(pgoFrom -> px, py)` spans.
  - Procedural sprite rendering for trees, crops, tilled soil, huts, fences, sheds, and people.
  - Ambient day/night lighting gradients.
  - Line-of-Sight (LOS) shadowcasting (`computeLOS`).
- **`play(root, seed)`**:
  - Keyboard controller (`WASD`, `E`, `Space`, `R`, `Q`, `1-7`, `Tab`, `Escape`).
  - Mobile touch D-pad & A/B action buttons.
  - Bottom hands strip inventory bar with selection highlight.
  - Top HUD clock and animated toast notifications.
  - Action Affordance Panel (`#panel`), Character Sheet ("Me" needs bars), Journal, and Site Store modal.
  - Real-time diagnostic telemetry: `window.sim.inspect()` and `window.sim.checkInvariants()`.
- **`Dashboards`**:
  - `runSim(root, seed, years)`: Multi-decade simulation chart and minimap.
  - `runGen(root, seed)`: 16x16 macro world generator inspector.
  - `runTests(root)`: In-browser quality gate runner.
  - `boot()`: Hash routing (`#play`, `#sim`, `#gen`, `#test`).

---

## 4. Execution & Verification Steps

1. Implement `src/sim.js` with un-golfed, clean, descriptive code.
2. Implement `src/view.js` with decoupled rendering, UI, and inspection hooks.
3. Implement `src/game.js` aggregating both modules.
4. Update `build.js` to bundle `src/sim.js` and `src/view.js` into `index.html`.
5. Execute regression test suites (`npm test`, `npm run test:playwright`, `npm run test:playtest`).
6. Validate simulation performance ($\ge 40,000$ events/sec) and visual presentation.
