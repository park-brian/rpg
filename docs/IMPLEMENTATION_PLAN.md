# Ford Simulation Engine — Master Implementation & TDD Plan

## 1. Vision, Principles & Architectural Foundations

The goal is to build an emergent life and settlement simulation engine in a single, standalone distribution file (`index.html`) under a strict **6,000-line budget**. The engine is built on deterministic discrete-event simulation with contiguous Struct-of-Arrays (SoA) memory layout and pure rule functions.

### Core Architectural Principles
1. **Headless First:** The entire simulation runs without UI dependencies. The world must survive decades in headless tests before rendering is considered.
2. **Unified Representations (No Duplicate Logic):**
   - **Entities:** Persons, beasts, and the player share a single `Person` store.
   - **Objects:** Tools, resources, buildings, and parts share a single `Thing` store.
   - **Interactions:** NPC↔NPC and Player↔NPC follow identical affordance and event pathways.
3. **Four Verbs Only:**
   - `step(untilTime)`: Advances the priority heap and dispatches events.
   - `inject(personId, intent)`: Enqueues player cursor intents (`move`, `act`, `wait`, `answer`, `become`).
   - `read(view)`: Returns read-only typed-array snapshots (`hot`, `person`, `acts`, `site`, `metrics`, `inspect`).
   - `hash()`: Computes deterministic state verification hashes.
4. **Test-Driven Development (TDD):** Every rule, mechanic, and milestone starts with a failing regression test or invariant gate.
5. **Derive, Don't Type:** Any hardcoded magic constant is marked with `// TYPED` until derived dynamically from simulation mechanics.

---

## 2. Current Baseline Assessment

### Existing Implementation (`src/game.js`, `ford-0012.html`)
- **Core Engine:** Min-heap event scheduler, deterministic PRNG (`makeRng`), FNV-1a hashing.
- **Nouns Implemented:** Basic `Person` (needs, hours, regard, beliefs), `Thing` (stacks, dual-indexed stock), `Parcel`/`Tile` (grid with soil fertility and tree cover), `Event` heap.
- **Rules Implemented:** Rule 1 (Needs decay & shelter), Rule 2 (Tool affordances & crafting), Rule 3 (Land & crop cycles), Rule 4 (Time & travel), Rule 6/7/9 (Claims, marriage, births, basic inheritance).
- **Tooling & Test Harness:** 
  - Standalone build pipeline (`build.js`) compiling `src/game.js` + `src/template.html` into `index.html`.
  - Node.js test runner suite (`npm test`) covering unit, integration, and E2E headless simulation.
  - In-browser `#test`, `#sim`, and `#play` hash routes.

---

## 3. TDD Testing & Quality Gate Architecture

Our TDD workflow enforces strict gates at three levels:

```
+-------------------------------------------------------------------+
|                        1. Unit Rule Tests                         |
|   (Pure function mutations, time math, heap invariants, affordance) |
+---------------------------------+---------------------------------+
                                  |
+---------------------------------v---------------------------------+
|                    2. Multi-Year Headless Sim                     |
|  (Determinism, survival rates, economic stability, invariant checks)|
+---------------------------------+---------------------------------+
                                  |
+---------------------------------v---------------------------------+
|                      3. Browser & E2E Specs                       |
|   (View contracts, cursor interaction, WebGL2/DOM render, worker) |
+-------------------------------------------------------------------+
```

### Critical Invariant Assertions
- **Determinism:** `hash(S_a) === hash(S_b)` after $N$ years given the same seed and input sequence.
- **Conservation of Stock:** `count(S, kind, holder, stuff)` must strictly match the sum of active `tqty` across all containers.
- **Grid Connectivity:** Zero isolated walkable tiles after worldgen or natural tree regrowth.
- **No Ghost Execution:** Inactive (`palive === 0`) entities never receive event dispatches or consume simulation hours.
- **Single Action Path:** Every action selectable by the player cursor must be executable by the heuristic planner.

---

## 4. Milestone Roadmap & Implementation Breakdown

### Milestone 1 (M1 Completion): One Family & Settlement Basics
- [x] Basic needs (food, sleep, warmth) and shelter benefits.
- [x] Basic agriculture (till, sow, harvest) and foraging.
- [x] Hut construction from parts (logs + thatch + labour).
- [ ] **Fences on Livestock/Crop Loss:** Automatically construct fencing around tilled parcels when threatened.
- [ ] **Storage Sheds on Surplus:** Emergent storage expansion when grain stocks exceed seasonal needs.
- [ ] **Complete Food Processing:** Threshing, grain milling into flour, and bread baking.
- **TDD Gate:** Family survives 20 years in ≥80% of seeds; 3-year drought reliably triggers famine response; shed and fence construction emerge under appropriate conditions.

### Milestone 2 (M2): Neighbors, Specialization & Economy
- [ ] **Person Skills & Attributes:** Add 12 skills (farming, carpentry, smithing, etc.) and physical attributes.
- [ ] **Tool Degradation & Repair:** Activate `twear` tracking; tools dull and break with use.
- [ ] **Craft Specialization:** Emergence of dedicated roles (Smith, Carpenter, Baker) based on comparative advantage.
- [ ] **Financial Instruments:** Labor hiring, wage payouts, debt recording, escrow, and village notice boards.
- [ ] **Social Gossip Network:** Propagation of news, deaths, reputations, and market price knowledge across social ties.
- **TDD Gate:** At least one household stops crafting their own tools within 5 years; smith replacement occurs within 3 years of smith death; grain price remains bounded (≤3× variance across seasons).

### Milestone 3 (M3): Run to Viable & Community Organization
- [ ] **Public Works & Collective Funding:** Construction of shared infrastructure (wells, stone bridge at the ford, palisades).
- [ ] **Emergent Patronage ("Lord"):** Wealthiest household allocates capital into public works and village defense.
- [ ] **Succession & Land Claims:** Multi-heir inheritance, land partition, and claim dispute resolution.
- **TDD Gate:** Village reaches population 30–200 and survives 60 years in ≥80% of seeds; growth sequence strictly follows historical stages (claim → farm → craft → public works).

### Milestone 4 & 7 (M4/M7): The Wild, Frontier & Tactical Combat
- [ ] **Beasts as Persons:** Animal anatomy, herbivore grazing, predator hunting territories, and breeding dens.
- [ ] **Anatomical Body Model:** Body regions (head, torso, limbs), wound types, bleeding rates, pain, and medical treatment (cloth bandages, herbal poultices).
- [ ] **Turn-Grid Combat:** Tactical cursor commands, limb targeting, party hours pooling (`follow` pointer).
- [ ] **Loss-Driven Bounties:** Community posts bounties on predators following livestock or villager attacks.
- **TDD Gate:** Bounties generate exclusively from actual losses; 4-person party den clear rate ≥60% vs 1-person ≤10%; untreated severe wounds result in ≥50% lethality.

### Milestone 5 (M5): Procedural Worldgen & Chunk Streaming
- [ ] **Macro-Geography Engine:** Procedural elevation, moisture, temperature, biomes, and hydraulic river networks.
- [ ] **Chunk Streaming Architecture:** Dynamic chunk generation and caching (<50ms per chunk at 1,000 km world scale).
- [ ] **Biome-Specific Materials:** Construction materials dynamically match local resources (stone, timber, mudbrick, reed).
- [ ] **`#gen` World Viewer:** Interactive macroscopic world map inspector.
- **TDD Gate:** Chunk streaming response times <50ms under rapid traversal; M3 viability gates pass across 20 diverse procedural biomes.

### Milestone 6 (M6): WebGL2 Rendering & Playable Integration
- [ ] **WebGL2 Tile & Sprite Pipeline:** High-performance hardware-accelerated batch rendering.
- [ ] **Line-of-Sight (LOS) & Lighting:** Dynamic shadowcasting, field-of-view fog, and day/night illumination gradients.
- [ ] **Procedural Composite Buildings:** Visual layering of architectural components (foundations, framing, walls, roofing).
- [ ] **40-Year Headless Pre-roll:** Game starts by running a settlement for 40 years before spawning the player as a wanderer on the road.
- **TDD Gate:** 60 FPS rendering on mobile with 100 active entities in viewport; inspector and menu views share identical read pipelines.

### Milestone 8 (M8): Deep Lifecycle, Succession & Magic
- [ ] **Generational "Become" Interface:** Seamless transition of control to an heir, relative, or new wanderer upon death.
- [ ] **Rule-Based Magic System:** Deep reagents + grimoire knowledge + time + bodily sacrifice/wounds.
- [ ] **Chronicle System:** Automatically generated historical settlement journal.
- **TDD Gate:** Complete multi-generational life cycle is playable; mages appear in ≤20% of generated worlds with full chronicle provenance.

### Milestone 9 (M9): Inter-Town Trade, Persistence & Polish
- [ ] **Multi-Settlement Trade Routes:** Traveling merchant caravans moving goods between established villages.
- [ ] **State Serialization:** Efficient binary/JSON snapshot persistence in IndexedDB.
- [ ] **Procedural Audio:** Web Audio API sound synthesis for footsteps, tools, weather, and ambient tone.
- [ ] **Line Budget Pruning:** Final optimization ensuring total codebase remains strictly under 6,000 lines.

---

## 5. Line Budget Allocation (6,000 Lines Target)

| Module / Section | Line Budget | Key Contents |
| :--- | :---: | :--- |
| `data` | 600 | Stuff table, crops, animals, beasts, parts, recipes, anatomy |
| `core` | 300 | PRNG, IDs, Heap, time math, SoA memory helpers, hashing |
| `land` | 400 | Parcel generation, weather/climate, yields, footfall, erosion |
| `things` | 400 | Stacks, objects, sites, parts, recipe resolution, wear |
| `person` | 700 | Needs, anatomy/wounds, skills, planner interface, heuristic planner |
| `social` | 400 | Households, regard, gossip, marriage, births, inheritance |
| `economy` | 400 | Price beliefs, trade negotiations, debt, hire, escrow, board |
| `frontier` | 400 | Beasts as Persons, ecology, combat grid, wound targeting |
| `build` | 300 | Claims, construction projects, collective public funding |
| `worldgen` | 400 | Noise, hydraulic erosion, biomes, river networks, site scoring |
| `render` | 500 | WebGL2 tiles & sprites, procedural buildings, LOS fog |
| `ui` | 700 | Input handling, hands strip, interaction panel, menu views, toasts |
| `tools` | 400 | Dashboard charts (`#sim`), map viewer (`#gen`), test runner (`#test`) |
| `boot` | 100 | Bootstrap, Web Worker messaging, save/load persistence |
| **Total** | **6,000** | Full standalone single-file distribution |

---

## 6. Execution Workflow for Each Feature

1. **Test First:** Write unit/integration tests in `tests/` asserting the new feature's behavior and quality gate.
2. **Data & Types:** Update data structures and SoA stores in `src/game.js`.
3. **Pure Rule Functions:** Write pure mutation functions operating directly on the stores.
4. **Event Integration:** Add event types to heap dispatch and heuristic planner cases.
5. **Regression Verification:** Run `npm test` and verify headless determinism and throughput.
6. **Bundle & Verify:** Run `node build.js` and verify browser behavior across `#test`, `#sim`, and `#play`.
