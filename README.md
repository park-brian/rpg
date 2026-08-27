# Ford — Simulation & Emergent Life RPG Engine

Ford is a deterministic discrete-event life and settlement simulation engine compiled into a standalone, single-file distribution (`index.html`).

---

## ⚙️ Core Features

* **Discrete-Event Simulation**: Min-heap priority event scheduler driving natural lifespans and circadian rhythms.
* **State-of-Arrays (SoA) Data Kernel**: High-performance contiguous memory buffers for person anatomy, wounds, skills, and dual-indexed item containers.
* **O(1) Spatial Occupancy Grid**: Instantaneous spatial lookups and collision tracking with multi-occupant reconciliation.
* **Four-Verb Primitive Contract**: All interactions adhere to `step()`, `inject()`, `read()`, and `hash()`.
* **Deep World Systems**: Agriculture, food processing, crafting, tool degradation, market price discovery, public works, anatomy, hunting, bounties, and rule-based magic.

---

## 🚀 Quick Start

### Build & Run
```bash
# Install dependencies
npm install

# Build standalone distribution (index.html)
npm run build

# Run local web server
npx http-server . -p 8080 -c-1
```

### Testing
```bash
# Run unit & simulation tests (42 tests)
npm test

# Run autonomous in-browser playtest bot
npm run test:playtest

# Run full Playwright E2E browser suite
npm run test:playwright
```

---

## 🎮 Controls

### Desktop
* **W / A / S / D** or **Arrow Keys**: Movement
+ **E** or **Space**: Primary contextual action
* **R** (or hold **A**): Open Affordance Menu
* **Q** or **Escape**: Cancel action / close menus
* **1 – 7**: Select inventory item
* **Menu Button (☰)**: Character stats ("Me"), Journal, Speed controls

### Mobile & Touch
* **D-Pad (Bottom-Left)**: Directional movement with hold-to-repeat
* **Button A (Bottom-Right)**: Tap for action; hold (350ms) for action menu
* **Button B (Bottom-Right)**: Cancel / unequip / close
* **Inventory Bar (Bottom)**: Tap any slot to select item

---

## 📖 Documentation

* [Player & AI Playtesting Guide](docs/TUTORIAL.md)
* [System Architecture & Refactoring Plan](docs/ARCHITECTURE_AND_REFACTORING_PLAN.md)
* [Technical Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
