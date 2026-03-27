# Upgrades Feature Architecture Audit

**Date:** March 25, 2026  
**Total Domain Size:** 4,318 lines of code across 8 files  
**Status:** Ready for refactoring phase

---

## 1. Main Upgrades Component

### File: [src/components/Upgrades.tsx](../src/components/Upgrades.tsx)

**Lines:** 839  
**Type:** React UI Component

#### Primary Responsibilities:

- **Tree Selection UI** - Display 5 upgrade trees (Combat, Resource, Magic, Farming, Expedition) as selectable buttons
- **Tree Navigation** - Switch between tree selection view and individual tree detail view
- **View Mode Toggle** - Support two rendering modes:
  1. **Normal View** - Linear list of upgrades with descriptions and prerequisites
  2. **Tree View** - Hierarchical tier-based layout with SVG connectors showing upgrade dependencies
- **Modal Dialog** - Detailed upgrade information modal with purchase confirmation
- **Purchase Buttons** - Action buttons with contextual labels (Locked/Unlock/Upgrade) and disabled states
- **Responsive Design** - Handles viewport width changes for mobile vs desktop tree layouts

#### Key State Management:

- `selectedTree` - Currently viewed upgrade tree
- `isTreeView` - Boolean flag for view mode
- `treeModalUpgradeId` - Selected upgrade for modal display
- `viewportWidth` - Tracks window resizing for responsive layout

#### Dependencies:

- `GameContext` & `useGameActions()` - Game state and dispatch
- `selectUpgradeTreeSummaries()` - Get tree overview
- `selectUpgradeTreeView()` - Get detailed tree layout
- `formatCompactNumber()` - Number formatting utilities

#### UI Output Interfaces:

```typescript
UpgradeTreeSummary {
  tree: string
  icon: string
  title: string
  upgradesCount: number
  unlockedCount: number
  totalLevel: number
}

UpgradeTreeViewModel {
  tree: string
  treeIcon: string
  treeTitle: string
  upgrades: UpgradePresentation[]
  tierEntries: UpgradeTierEntry[]
  treeConnectors: UpgradeTreeConnector[]
  layout: UpgradeTreeLayout
  selectedModalPresentation: UpgradePresentation | null
}
```

---

## 2. Domain Logic Files

### 2.1 Core Upgrades Definition & Business Logic

#### File: [src/game/upgrades.ts](../src/game/upgrades.ts)

**Lines:** 965  
**Type:** Business Logic & Data Definition

#### Structure:

**A. Data Layer: upgradeDefinitions**

- Complete registry of 44 upgrades across 5 trees
- Trees: Combat (8), Resource (15), Magic (5), Farming (8), Expedition (4)
- Each upgrade includes:
  - Basic metadata: `id`, `name`, `description`
  - Progression: `level`, `baseCost`, `scaling` (1.5-2.22x)
  - Type classification: `type` (attackBoost, autoGold, etc.), `tree`
  - Stat bonuses: `bonuses[]` with percentage and flat multipliers
  - Dependency graph: `prerequisites[]`, `linkedUpgrades[]`

**Example Upgrade Structure:**

```typescript
attack_i: {
  id: "attack_i";
  name: "Attack I";
  baseCost: 50;
  scaling: 1.5;
  tree: "combat";
  bonuses: [{ percentBonusType: "attack", percentBonusAmount: 0.1 }];
  prerequisites: [];
  linkedUpgrades: [{ upgradeId: "sharp_blade", unlocksAtLevel: 1 }];
}
```

**B. Query Functions (5 functions)**

| Function                                | Purpose                                                        | Inputs               | Returns         |
| --------------------------------------- | -------------------------------------------------------------- | -------------------- | --------------- |
| `getUpgradeDef(upgradeId)`              | Lookup upgrade definition                                      | upgradeId: string    | Upgrade \| null |
| `getUpgradeLevel(state, upgradeId)`     | Get current level of purchased upgrade                         | GameState, upgradeId | number          |
| `getUpgradesByTree(tree)`               | Get all upgrades in a tree                                     | tree: string         | Upgrade[]       |
| `getUpgradeTrees()`                     | Get list of all trees                                          | none                 | string[]        |
| `getUnlockedUpgrades(state, upgradeId)` | Find upgrades unlocked by this upgrade reaching certain levels | GameState, upgradeId | string[]        |

**C. Validation Functions (2 functions)**

| Function                                       | Purpose                                                   | Validation Logic                                                |
| ---------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------- |
| `areUpgradePrerequisitesMet(state, upgradeId)` | Check if all prerequisites are met and at required levels | Validates all prerequisite IDs exist and are level > 0          |
| `isUpgradeUnlocked(state, upgradeId)`          | Check if upgrade is unlocked (can be purchased)           | Ensures prerequisites met AND linked level thresholds satisfied |

**D. Action/Mutation Function**

| Function                       | Purpose                     | Logic                                                                     |
| ------------------------------ | --------------------------- | ------------------------------------------------------------------------- |
| `buyUpgrade(state, upgradeId)` | Purchase/upgrade an upgrade | 1. Validate unlock status 2. Calculate cost 3. Check gold 4. Update state |

#### Upgrade Dependency Patterns:

- **Sequential Chain:** A → B → C (e.g., attack_i → sharp_blade → battle_frenzy)
- **Branching:** Single prerequisite with multiple unlocks (plant_mastery → better_watering, composting)
- **Convergence:** Multiple prerequisites required (soil_aeration requires both better_watering AND composting)
- **Cross-tree Dependencies:** Void Contracts requires bounty_syndicate (expedition) + gem_hunter (resource)

#### Key Algorithms:

**Cost Calculation:**

```typescript
cost = baseCost × scaling^(currentLevel)
Example: attack_i at level 3 = 50 × 1.5³ = 168.75 gold
```

**Stat Bonus Application:**

```typescript
bonusPercentage = percentBonusAmount × level × 100
Example: 10% attack per level at level 3 = 0.1 × 3 × 100 = 30% attack bonus
```

---

### 2.2 Engine Integration & Item Upgrades

#### File: [src/game/engine.ts](../src/game/engine.ts)

**Lines:** 946 (partial - 100+ lines dedicated to upgrades)  
**Related Functions:**

| Function                                   | Location      | Purpose                                                                    |
| ------------------------------------------ | ------------- | -------------------------------------------------------------------------- |
| `getUpgradeStats(state)`                   | Lines 586-610 | Calculate total stat bonuses from all purchased upgrades                   |
| `upgradeItem(state, itemUid)`              | Lines 504+    | Apply gem-based upgrading to inventory items (separate from tree upgrades) |
| `calculateUpgradeCost(level, rarity, ...)` | Lines 173+    | Calculate gem cost for item upgrades (not tree upgrades)                   |

**Key Integration Point: getUpgradeStats()**

- Iterates through `state.upgrades[]`
- For each upgrade's bonuses:
  - Accumulates flat bonuses (e.g., +2 attack per level)
  - Accumulates percentage bonuses (applied as `stat × (1 + percentBonus × level)`)
- Returns `Partial<Stats>` merged into total stat calculations
- Called by `getTotalStats()` which feeds combat/progression systems

---

### 2.3 Game Configuration

#### File: [src/game/gameConfig.ts](../src/game/gameConfig.ts)

**Lines:** 528 (partial - lines 435-460+ contain UPGRADE_CONFIG)  
**Type:** Configuration Constants

#### Structure:

```typescript
UPGRADE_CONFIG = {
  upgrades: {
    attack_1: {
      baseCost: 50
      costScale: 1.5
      statBonus: 0.1
      statType: "attack%"
    }
    // ... more upgrades
  }
}
```

**Note:** This config appears to be **legacy/redundant** - the primary source of truth is now `upgradeDefinitions` in [src/game/upgrades.ts](../src/game/upgrades.ts). The config file may need cleanup during refactoring.

---

### 2.4 Redux Actions Layer

#### File: [src/game/actions.ts](../src/game/actions.ts)

**Lines:** ~120 (relevant section)  
**Type:** Action Types & Reducer

#### Upgrade-Related Action:

```typescript
{
  type: "upgrade/buy";
  upgradeId: string;
}
```

#### Action Handler in reduceGameAction():

- Calls `buyUpgrade(state, upgradeId)`
- Returns updated state with new upgrade level and reduced gold
- Dispatched through `useGameActions()` hook

---

## 3. Selectors (UI Presentation Layer)

### File: [src/game/selectors/upgrades.ts](../src/game/selectors/upgrades.ts)

**Lines:** 409  
**Type:** Memoized Selectors & Presentation Logic

#### Interfaces Defined (8 interfaces):

| Interface                | Purpose                              | Key Fields                                                                |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------------------- |
| **UpgradeTreeSummary**   | Overview card for each tree          | tree, icon, title, upgradesCount, unlockedCount, totalLevel               |
| **UpgradePresentation**  | Single upgrade display data          | upgrade, icon, level, cost, canAfford, isUnlocked, prereqText, linkedText |
| **UpgradeTierEntry**     | Group of upgrades at same tree depth | tier: number, upgrades: UpgradePresentation[]                             |
| **UpgradeTreeConnector** | SVG path data for dependency lines   | startX/Y, endX/Y, controlY1/2, purchased                                  |
| **UpgradeTreeLayout**    | Responsive geometry config           | isMobileTree, treeNodeWidth, treeColumnGap, treeNodeHeight, etc.          |
| **UpgradeTreeViewModel** | Complete tree view state             | tree, treeIcon, upgrades, tierEntries, treeConnectors, layout             |
| **UpgradePresentation**  | Details for single upgrade modal     | All fields from above                                                     |
| **UpgradeTierEntry**     | Horizontal group at tier             | tier number, upgrades array                                               |

#### Selector Functions (3 main):

**1. selectUpgradeTreeSummaries(state)**

- Input: GameState
- Output: UpgradeTreeSummary[]
- Logic:
  - Iterates all trees via `getUpgradeTrees()`
  - For each tree, counts total upgrades, unlocked upgrades, total levels
  - Assigns tree icon emoji

**2. selectUpgradePresentation(state, upgradeDef)**

- Input: GameState, Upgrade definition
- Output: UpgradePresentation
- Logic:
  - Calculates next upgrade cost
  - Determines affordability
  - Checks unlock status and prerequisite satisfaction
  - Generates prerequisite requirement text
  - Generates linked unlock text
  - Determines action label (Locked/Unlock/Upgrade)
  - Generates prerequisite and linked upgrade name arrays

**3. selectUpgradeTreeView(state, tree, viewportWidth, treeModalUpgradeId)**

- Input: GameState, tree name, viewport width, selected upgrade ID
- Output: UpgradeTreeViewModel
- Complex Logic:
  - **Tier Calculation:** Uses recursive `getUpgradeTier()` with memoization
    - Tier 0 = no prerequisites (root nodes)
    - Tier N = max(prerequisite tiers) + 1
  - **Presentation Building:** Calls `selectUpgradePresentation()` for each upgrade
  - **Tier Grouping:** Groups upgrades by tier, sorts alphabetically
  - **Layout Calculation:** Calls `getUpgradeTreeLayout()` to compute:
    - Node dimensions (width, height, padding)
    - Spacing (column gap, row gap)
    - Font sizes for mobile vs desktop
    - Board dimensions for SVG container
  - **Node Positioning:** Calculates x/y coordinates for each node
  - **Connector Generation:** Creates SVG bezier curves from prerequisites to successors
    - Checks `purchased` status to color differently
  - **Modal Selection:** If `treeModalUpgradeId` matches, returns that upgrade's presentation

#### Helper Functions:

| Function                     | Output         | Use                                               |
| ---------------------------- | -------------- | ------------------------------------------------- |
| `getTreeIcon(tree)`          | string (emoji) | Decorative icon for tree type                     |
| `getUpgradeIcon(upgradeDef)` | string (emoji) | Smart icon selection based on upgrade.id patterns |
| `capitalize(string)`         | string         | Utility for title case                            |

---

## 4. Tests

### 4.1 Domain Logic Tests

#### File: [src/game/upgrades.test.ts](../src/game/upgrades.test.ts)

**Lines:** 209  
**Test Suites:** 2

**Suite 1: "Upgrade System - Farming Branching"**

- Tests dual-branch farming tree (better_watering + composting → soil_aeration)
- 6 test cases covering:
  - Upgrade definition inclusion
  - Single branch unlocks at level 1
  - Multi-prerequisite unlock (both required)
  - Locked state until all prerequisites met
  - Unlock threshold validation for later upgrades
  - Metadata alignment for dual prerequisites

**Suite 2: "Upgrade System - Modern Tree Graph"**

- Tests larger prerequisite chains involving 4+ upgrades
- 3 test cases covering:
  - New tree inclusion (Expedition, Resource trees)
  - Cross-tree linked prerequisites (bounty_syndicate + gem_hunter → void_contracts)
  - Dual resource branches (gold_rush path + energy_conservation path → singularity_bank)

**Test Patterns:**

- Uses `createDefaultState()` with unlimited gold (`1_000_000_000_000`)
- Progressively upgrades via `buyUpgrade()` loop
- Validates unlock status with `isUpgradeUnlocked()`
- Validates prerequisites with `areUpgradePrerequisitesMet()`

---

### 4.2 Selector Tests

#### File: [src/game/selectors/upgrades.test.ts](../src/game/selectors/upgrades.test.ts)

**Lines:** 58  
**Test Cases:** 2

**Test 1: "builds upgrade tree summaries from current state"**

- Creates state with 2 levels of gold_rush, 1 level of mage_talent
- Uses `selectUpgradeTreeSummaries()` to verify:
  - Tree icons work (💰)
  - Total level tallying
  - Unlocked count calculation

**Test 2: "builds purchase and tree-layout view models"**

- Advanced state with 3 gold_rush + 1 gold_efficiency
- Verifies `selectUpgradePresentation()`:
  - Level tracking
  - Purchase feasibility
  - Linked upgrade text generation
- Verifies `selectUpgradeTreeView()`:
  - Tier entry generation (multiple tiers)
  - Connector generation (SVG paths)
  - Modal presentation selection
  - Layout dimension calculation

---

### 4.3 Action Integration Tests

#### File: [src/game/actions.test.ts](../src/game/actions.ts)

**Lines:** ~20 (upgrade-related)  
**Location:** Lines 253-270

**Test: "buys an upgrade through reducer action"**

- Creates state with 1000 gold
- Dispatches `{ type: "upgrade/buy", upgradeId: "attack_i" }`
- Verifies:
  - Attack_i level becomes 1
  - Gold decreases by cost
  - State immutability maintained

---

## 5. Types & Interfaces

### File: [src/game/types.ts](../src/game/types.ts)

**Lines:** 364 (lines 308-345 are upgrade-related)

#### Type Definitions:

**UpgradeType enum** (Line 308)

```typescript
type UpgradeType =
  | "attackBoost"
  | "autoGold"
  | "energyRegen"
  | "gemFinder"
  | "plantGrowth"
  | "wateringDuration";
```

**UpgradeBonus interface** (Line 317)

```typescript
interface UpgradeBonus {
  attackMultiplier?: number; // Legacy per-level flat multiplier
  defenseMultiplier?: number; // Legacy per-level flat multiplier
  intelligenceMultiplier?: number; // Legacy per-level flat multiplier
  goldMultiplier?: number; // Legacy per-level flat multiplier
  statsFlat?: Partial<Stats>; // Flat stat additions
  percentBonusType?: keyof Stats; // Which stat receives % bonus
  percentBonusAmount?: number; // % per level (e.g., 0.1 = 10%)
}
```

**LinkedUpgrade interface** (Line 328)

```typescript
interface LinkedUpgrade {
  upgradeId: string;
  unlocksAtLevel?: number; // Defaults to 1 if not specified
}
```

**Upgrade interface** (Line 333)

```typescript
interface Upgrade {
  id: string;
  name: string;
  description?: string;
  level: number; // Instance level (0 = not purchased)
  baseCost: number; // Cost at level 0
  scaling: number; // Exponential cost multiplier
  type: UpgradeType;
  tree: string; // e.g., "combat", "resource"
  bonuses: UpgradeBonus[];
  prerequisites?: string[]; // Must be purchased first
  linkedUpgrades?: LinkedUpgrade[]; // Unlocked by this upgrade
}
```

---

## 6. Dependency Relationships

### Upward Dependencies (Components depending on domain)

```
Upgrades.tsx
  ├─ selectUpgradeTreeSummaries()
  ├─ selectUpgradeTreeView()
  ├─ useGameActions().buyUpgrade()
  └─ formatCompactNumber()
```

### Downward Dependencies (Domain layer)

```
upgrades.ts (core)
  ├─ types.ts (Upgrade, UpgradeBonus, LinkedUpgrade definitions)
  ├─ state.ts (defaultState with initial upgrades)
  └─ imports/exports used by:
      ├─ selectors/upgrades.ts
      ├─ engine.ts (getUpgradeStats)
      ├─ actions.ts (buyUpgrade reducer handler)
      └─ useGameActions.ts

selectors/upgrades.ts
  ├─ upgrades.ts (all query/validation functions)
  ├─ types.ts (Upgrade interface)
  └─ utilities (capitalize)

actions.ts & engine.ts
  └─ upgrades.ts (buyUpgrade logic)
```

### Cross-Domain Integration

```
engine.ts
  ├─ getUpgradeStats() → feeds into getTotalStats()
  │  └─ Used by combat.ts, progression.ts, garden.ts
  └─ upgradeItem() → separate from tree upgrades
     (item gem-based leveling)

GameContext.tsx (Redux dispatch)
  └─ Reduces "upgrade/buy" action
     └─ Calls buyUpgrade(state, upgradeId)
```

---

## 7. Code Metrics Summary

| Aspect                        | Value                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| Total LOC (Upgrades domain)   | 4,318                                                                               |
| Total Upgrades (all trees)    | 44                                                                                  |
| Total Upgrade Trees           | 5                                                                                   |
| Largest tree                  | Resource (15 upgrades)                                                              |
| Max prerequisite chain length | 4 steps (attack_i → sharp_blade → battle_frenzy → ruthless_tempo → immortal_legion) |
| Max cost scaling              | 2.22x (singularity_bank)                                                            |
| Base costs range              | 50-150 gold (root), 1800-8000 gold (capstones)                                      |
| Test coverage files           | 3 files, 269 total test lines                                                       |
| Selector count                | 3 main selectors, 8 interfaces                                                      |
| Presentation interfaces       | 5 (UpgradePresentation, TreeSummary, ViewModel, etc.)                               |

---

## 8. Architecture Strengths

✅ **Clean Separation of Concerns**

- Domain logic (upgrades.ts) isolated from UI (Upgrades.tsx)
- Selectors handle presentation layer distinctly
- Types well-defined in types.ts

✅ **Robust Prerequisite System**

- Support for sequential chains, branching, and convergence
- Cross-tree prerequisites working correctly
- Locked/unlocked validation comprehensive

✅ **Good Test Coverage**

- Domain logic tested (purchases, unlocks)
- Selector outputs tested
- Action integration tested

✅ **Responsive UI**

- Desktop (tree view with SVG) and mobile (compact) layouts
- Dynamic viewport handling
- Modal overlay for details

✅ **Extensible Definition Structure**

- Adding new upgrades requires only editing upgradeDefinitions
- No hardcoded upgrade configuration

---

## 9. Architecture Issues & Refactoring Opportunities

⚠️ **Redundant Configuration**

- gameConfig.ts UPGRADE_CONFIG appears unused (true source is upgradeDefinitions)
- Should be removed or unified

⚠️ **Tier Calculation Inlined**

- `getUpgradeTier()` recalculated in selectUpgradeTreeView() every render
- Could be memoized as separate function
- Could be cached in state for O(1) lookups

⚠️ **Button State Logic Complex**

- Upgrades.tsx has nested ternary conditions for button states
- Could extract `getButtonState()` utility
- Prerequisites/linked requirement text generation is repetitive

⚠️ **Large Presentation Objects**

- UpgradePresentation has 17 fields, many derived
- Could split into `UpgradeData` (5 fields) vs presentation concerns

⚠️ **Tree Icons Hardcoded**

- Icon selection logic distributed in getUpgradeIcon()
- Could centralize in upgrade definitions or config

⚠️ **Cost Calculation Duplicated**

- Cost formula in buyUpgrade() mirrors selector cost calculation
- Should extract to shared utility

⚠️ **Selector Performance**

- selectUpgradeTreeView() is O(n²) due to recursion + re-rendering
- Could optimize with topological sort + memoization

---

## 10. Refactoring Phase Recommendations

### Phase 1: Cleanup

- [ ] Remove/consolidate UPGRADE_CONFIG in gameConfig.ts
- [ ] Extract button state logic from Upgrades.tsx
- [ ] Centralize cost calculation formula

### Phase 2: Optimization

- [ ] Extract and memoize tier calculation
- [ ] Refactor selectUpgradePresentation() into smaller functions
- [ ] Implement cost calculation caching

### Phase 3: Architecture

- [ ] Consider upgrading UpgradePresentation into separate data/presentation split
- [ ] Evaluate state normalization for upgrade levels (currently array search O(n))
- [ ] Plan tree icon centralization

### Phase 4: Testing

- [ ] Add tests for edge cases (max level, cost overflow, concurrent purchases)
- [ ] Performance benchmarks for large trees
- [ ] Accessibility testing for tree view SVG

---

## Appendix: Upgrade Tree Structure Visualization

```
COMBAT TREE (8 upgrades)
├─ Tier 0 (2 roots)
│  ├─ Attack I
│  └─ Defense I
├─ Tier 1 (2)
│  ├─ Sharp Blade (← Attack I:Lv1)
│  └─ Iron Skin (← Defense I:Lv1)
├─ Tier 2 (2)
│  ├─ Battle Frenzy (← Sharp Blade:Lv5)
│  └─ Guardian Core (← Iron Skin:Lv4)
├─ Tier 3 (1)
│  └─ Warlord Doctrine (← Attack Mastery + Guardian Core)
├─ Tier 4 (1)
│  ├─ Ruthless Tempo (← Battle Frenzy + Warlord Doctrine)
└─ Tier 5 (1)
   └─ Immortal Legion (← Ruthless Tempo:Lv4)

FARMING TREE (8 upgrades, dual-branch convergence)
├─ Tier 0 (1 root)
│  └─ Plant Mastery
├─ Tier 1 (2 parallel)
│  ├─ Better Watering (← Plant Mastery:Lv1)
│  └─ Composting (← Plant Mastery:Lv1)
├─ Tier 2 (1 convergence)
│  └─ Soil Aeration (← Better Watering + Composting)
└─ [continues to capstone Biome Fusion]

EXPEDITIONS TREE (4 upgrades, cross-tree dependency)
├─ Tier 0-3 [structure similar to combat]
└─ Tier 4 (capstone)
   └─ Void Contracts (← Bounty Syndicate + Gem Hunter:Lv6)
```
