# Ford — Simulation and Emergent Life RPG Engine

Ford is a deterministic discrete-event life, settlement, and survival simulation engine compiled into a single self-contained distribution (`index.html`).

Set in a procedurally generated wilderness surrounding a river ford, the engine simulates multi-generational human settlements, wildlife ecology, crop cultivation, market trade, and emergent social dynamics.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Player Controls](#player-controls)
- [Core Survival Systems](#core-survival-systems)
  - [Vital Needs](#vital-needs)
  - [Time, Day-Night Cycles, and Seasons](#time-day-night-cycles-and-seasons)
  - [Anatomy, Wounds, and Medical Care](#anatomy-wounds-and-medical-care)
- [Tools, Crafting, and Resource Gathering](#tools-crafting-and-resource-gathering)
  - [Tool Types and Applications](#tool-types-and-applications)
  - [Tool Wear, Breakage, and Inventory](#tool-wear-breakage-and-inventory)
  - [Resource Harvesting](#resource-harvesting)
- [Agriculture and Food Processing](#agriculture-and-food-processing)
  - [Tilling and Sowing](#tilling-and-sowing)
  - [Crop Growth and Harvesting](#crop-growth-and-harvesting)
  - [Milling Flour and Baking Bread](#milling-flour-and-baking-bread)
- [Construction and Settlement Infrastructure](#construction-and-settlement-infrastructure)
  - [Homestead Huts](#homestead-huts)
  - [Storage Sheds](#storage-sheds)
  - [Crop Protection Fences](#crop-protection-fences)
  - [Public Infrastructure: Bridges and Wells](#public-infrastructure-bridges-and-wells)
- [Economy, Trade, and Social Dynamics](#economy-trade-and-social-dynamics)
  - [Subjective Valuation and Price Discovery](#subjective-valuation-and-price-discovery)
  - [Barter, Currency, and Gossip](#barter-currency-and-gossip)
  - [Labor Hiring, Debt, and Emergent Patronage](#labor-hiring-debt-and-emergent-patronage)
  - [Kinship, Marriage, and Inheritance](#kinship-marriage-and-inheritance)
- [Wildlife, Hunting, and Tactical Combat](#wildlife-hunting-and-tactical-combat)
- [Vision, Magic, and Generational Perspective](#vision-magic-and-generational-perspective)
  - [Field of View and Line-of-Sight](#field-of-view-and-line-of-sight)
  - [Generational Perspective Switching](#generational-perspective-switching)
  - [Rule-Based Magic System](#rule-based-magic-system)
- [Simulation Architecture and Headless API](#simulation-architecture-and-headless-api)
- [Testing and Quality Assurance](#testing-and-quality-assurance)

---

## Quick Start

### Prerequisites
- Node.js 20+ (Node.js 26 supported)
- Modern web browser (Chromium, Firefox, Safari, Edge)

### Build and Launch
```bash
# Install development dependencies
npm install

# Compile the standalone distribution (generates index.html and dist/index.html)
npm run build

# Start local development server
npm start
```

Open `http://127.0.0.1:8080` in your web browser.

---

## Player Controls

The interface supports desktop keyboard and mouse input as well as touch-screen mobile devices.

### Desktop Controls

| Key / Input | Action | Description |
| :--- | :--- | :--- |
| **W / A / S / D** or **Arrow Keys** | Walk / Face | Moves character North, West, South, or East. |
| **E** or **Space** | Primary Action | Triggers the default context affordance (e.g. Gather, Till, Chop, Eat). |
| **R** (or hold **A** button) | Affordance Menu | Displays all possible interactions on the targeted tile. |
| **Q** or **Escape** | Cancel / Back | Cancels the current ongoing work span or closes active dialogs. |
| **1 – 7** | Select Tool Slot | Equips or focuses an item from the hands bar. |
| **Menu Button (top-left)** | Game Menu | Opens Character Sheet ("Me"), Journal log, or Simulation Speed panel. |

### Mobile / Touch Controls

- **D-Pad (Bottom-Left)**: Directional movement with hold-to-repeat support.
- **Button A (Bottom-Right)**: Tap to perform context action; hold (350ms) to open the full Affordance list.
- **Button B (Bottom-Right)**: Cancel active work, unequip selected tool, or close dialogs.
- **Hands Strip (Bottom)**: Scrollable toolbar showing held items. Tap any slot to equip or inspect.

---

## Core Survival Systems

### Vital Needs

Every living entity tracks five primary physiological and psychological needs rated from 0 to 100:

1. **Hunger (Food)**: Decays continuously. Eating cooked food (e.g., bread) restores hunger. Severe starvation causes physical degradation and eventually death.
2. **Fatigue (Sleep)**: Depleted while awake and performing manual labor. Restored by resting on the ground or sleeping inside a built hut.
3. **Warmth**: Decreases in cold weather, rain, and winter. Standing near a hearth, wearing warm clothing, or staying inside a thatched hut provides protection.
4. **Safety**: Degraded by the proximity of hostile predators, untreated wounds, or freezing temperatures.
5. **Social (Company)**: Depleted by prolonged isolation. Restored by conversing, trading, or working alongside neighboring villagers.

### Time, Day-Night Cycles, and Seasons

- **Simulation Minute**: The fundamental atomic time step of the engine.
- **Day Length**: 1,440 simulation minutes (24 hours). Daylight spans from 06:00 to 20:00.
- **Year and Seasons**: 360 days per year, divided into four 90-day seasons:
  - **Spring (Days 0–89)**: Optimal planting season; rainfall is frequent.
  - **Summer (Days 90–179)**: Peak agricultural growth; maximum warmth.
  - **Autumn (Days 180–269)**: Harvest season; crops must be gathered before winter frost.
  - **Winter (Days 270–359)**: Dormant vegetation; freezing temperatures require stored grain and hearth warmth.

### Anatomy, Wounds, and Medical Care

The anatomical model divides each entity into discrete body parts: Head, Torso, Left Arm, Right Arm, Left Leg, and Right Leg.

- Combat injuries and accidents inflict specific wound severities (Scratch, Bruise, Laceration, Fracture).
- Untreated open wounds cause bleeding, reduce mobility/work speed, and decrease safety.
- Wounds can be treated using clean bandages and herbal salves.

---

## Tools, Crafting, and Resource Gathering

### Tool Types and Applications

- **Knife**: Used to harvest wild thatch from grassy plains, dress animal carcasses, and prepare reeds.
- **Axe**: Used to fell timber trees, split logs into construction lumber, and defend against predators.
- **Spade**: Used to break untilled earth into farmland, dig drainage furrows, and excavate wells.
- **Waterskin**: Used to draw clean freshwater from river fords and drink while traveling.

### Tool Wear, Breakage, and Inventory

- Every tool undergoes gradual wear with usage.
- Broken tools lose functionality and can be stored in settlement sheds or dropped onto walkable ground tiles.
- Items can be dropped (`drop`) on any open tile or picked up (`take`) without un-equipping existing gear.

### Resource Harvesting

- **Thatch**: Harvested from tall grass tiles using a knife. Used for roofing and crop insulation.
- **Timber / Wood**: Harvested from forest trees using an axe. Used for framing huts, constructing sheds, and building bridges.
- **Stone**: Excavated from rocky outcrops for well construction and bridge abutments.

---

## Agriculture and Food Processing

Settlements rely on a four-stage agricultural cycle to avoid winter famines:

```
[Untilled Earth] --(Spade)--> [Farmland] --(Grain)--> [Sown Plot]
                                                           |
[Flour / Bread] <--(Mill)--- [Harvested Grain] <--(Autumn Growth)
```

### Tilling and Sowing
1. Use a **Spade** on grassland to till the soil into a fertile farm plot (`dirt` / `farm`).
2. Select **Grain** in your hand and sow the seeds into the tilled earth.

### Crop Growth and Harvesting
- Crops progress through germination, vegetative growth, and ripening based on seasonal temperature and soil moisture.
- In Autumn, ripe crops turn golden and can be harvested for raw grain bundles and thatch.

### Milling Flour and Baking Bread
- Raw grain is processed at a stone quern or mill into bags of **Flour**.
- Flour is mixed with water and baked inside a homestead hut hearth into nutritious **Bread**, which restores substantial hunger.

---

## Construction and Settlement Infrastructure

Settlers collaborate to build infrastructure that improves survivability across seasons:

### Homestead Huts
- **Structure**: Constructed from 4 timber posts and 4 thatch bundles.
- **Functionality**: Provides shelter from rain, retains warmth during winter, offers comfortable sleeping quarters, and houses the domestic hearth.

### Storage Sheds
- When a settlement produces a surplus of grain (e.g. >100 units), villagers erect a communal storage shed.
- Protects grain and flour from spoilage, moisture, and pests.

### Crop Protection Fences
- Built around farmland borders using timber stakes.
- Prevents wild herbivores (deer, sheep) from consuming immature crops.

### Public Infrastructure: Bridges and Wells
- **Stone Well**: Excavated in central village courtyards to provide convenient access to freshwater away from the riverbank.
- **River Bridge**: Spans river ford tiles, allowing villagers and livestock to cross water without movement penalties or hypothermia risks.

---

## Economy, Trade, and Social Dynamics

### Subjective Valuation and Price Discovery
The economy operates on decentralized marginal utility rather than fixed prices:
- Each person maintains an internal price belief vector based on personal inventory scarcity and recent observations.
- A hungry villager values bread higher than coins; a craftsman values timber over raw grain.

### Barter, Currency, and Gossip
- Transactions execute via direct commodity barter or copper **pennies**.
- When two characters meet, they exchange social **gossip**, propagating price knowledge, danger warnings, and personal regard ratings.

### Labor Hiring, Debt, and Emergent Patronage
- Wealthier landholders hire neighboring laborers to assist in harvesting or building.
- Debts are tracked in an internal ledger and settled through labor or harvest shares.
- Prosperous villagers may emerge as community patrons ("Lords"), funding large public works like stone bridges and communal granaries.

### Kinship, Marriage, and Inheritance
- Adults form partnerships and establish joint households based on mutual regard and economic stability.
- Children inherit property, claims to homestead land, and family toolsets upon the death of parents.

---

## Wildlife, Hunting, and Tactical Combat

Wildlife entities share the unified State-of-Arrays person architecture:

- **Herbivores (Deer, Sheep)**: Graze on grassland, avoid humans, and flee from predators.
- **Predators (Wolves, Boars)**: Hunt wildlife and threaten isolated settlers.
- **Hunting Parties & Bounties**: Following predator attacks, settlements organize cooperative hunting parties with axes and spears, posting bounties to eliminate threats.

---

## Vision, Magic, and Generational Perspective

### Field of View and Line-of-Sight
The engine computes 360-degree raycasted Line-of-Sight (LOS) in real-time. Unexplored areas and regions obscured by dense walls or forest canopies remain shrouded in fog of war until explored.

### Generational Perspective Switching
Players are not locked into a single immortal character:
- Using the `become` intent, players can pass their perspective down to their children or switch to any living member of their settlement dynasty.

### Rule-Based Magic System
Occult phenomena follow strict thermodynamic rules:
- Requires three components: an ancient **Grimoire**, specific **Chemical Reagents**, and a **Bodily Sacrifice** (vitality or blood).
- Effects include soil rejuvenation, weather blessing, or predator warding.

---

## Simulation Architecture and Headless API

The core simulation engine (`src/sim.js`) is completely decoupled from the rendering frontend (`src/view.js`).

### The Four Verbs Contract

All external interaction with the simulation occurs through four deterministic primitives:

```javascript
// 1. Advance simulation time
step(sim, untilMinute);

// 2. Queue intent for an entity
inject(sim, personId, { k: 'act', act: 'fell', target: tileIndex });

// 3. Read immutable structured view
const status = read(sim, { person: personId });

// 4. Compute deterministic state hash
const stateHash = hash(sim);
```

### State-of-Arrays (SoA) Kernel
All entity properties (positions, needs, skills, wounds, inventory links) are stored in contiguous typed arrays (`Int16Array`, `Float32Array`, `Uint8Array`), ensuring cache efficiency, garbage-collector-free execution, and 40,000+ events/sec headless throughput.

---

## Testing and Quality Assurance

The codebase includes comprehensive test suites across unit logic, simulation invariants, and headless browser automation:

```bash
# Run unit and simulation invariant tests (42 test suites)
npm test

# Run autonomous in-browser playtest bot
npm run test:playtest

# Run full Playwright browser suite across Desktop Chromium and Mobile Safari
npm run test:playwright
```

