# Developer Setup and Quick Start

**Purpose:** Get a developer up and running, understand project structure, and begin contributing.

---

## 1. Prerequisites

- **Node.js:** Latest LTS (v20+ recommended)
- **npm:** 10.0.0+
- **Git:** For version control
- **IDE:** VS Code recommended (project configured with ESLint, TypeScript)
- **Browser:** Chrome, Firefox, or Edge for dev/testing

---

## 2. Project Initialization

### Clone and install

```bash
git clone <repository-url>
cd lifeupidleextension
npm install
```

### Verify setup

```bash
npm run lint          # Should pass with no errors
npm run build         # Should complete in <300ms
npm run test:run      # Should show 235 tests passing
```

If all three commands succeed, you're ready to develop. ✅

---

## 3. Project Structure

```
lifeupidleextension/
├── src/
│   ├── main.tsx                    # App entry point
│   ├── index.css                   # Global styles
│   ├── App.tsx                     # Main app shell with tab navigation
│   ├── App.css                     # App styling
│   ├── components/                 # React UI components
│   │   ├── Main.tsx                # Utility/debug screen
│   │   ├── Inventory.tsx           # Item management
│   │   ├── Character.tsx           # Class and skill tree
│   │   ├── Upgrades.tsx            # Upgrade tree UI
│   │   ├── Garden.tsx              # Garden and crops UI
│   │   ├── Fight.tsx               # Combat system UI
│   │   └── ...modals/              # GlobalOverlay modals
│   ├── game/                       # Game logic (NOT UI)
│   │   ├── GameContext.tsx         # React context + provider (state management)
│   │   ├── engine.ts               # Core game stats, item operations, potion effects
│   │   ├── combat.ts               # Combat simulation, DPS, rewards
│   │   ├── garden.ts               # Crop lifecycle, automation, fields
│   │   ├── progression.ts          # Level progression and XP
│   │   ├── upgrades.ts             # Upgrade tree definitions and purchase logic
│   │   ├── items.ts                # Item definitions and operations
│   │   ├── storage.ts              # Persistence and migrations
│   │   ├── tokenRewards.ts         # Token-based reward system
│   │   ├── numberFormat.ts         # Number formatting utilities
│   │   ├── types.ts                # TypeScript type definitions
│   │   ├── classes/                # Class system
│   │   │   ├── index.ts            # Public class API
│   │   │   ├── berserker.ts, sorceress.ts, etc.
│   │   │   └── ...
│   │   ├── selectors/              # Derived state (pure functions)
│   │   │   ├── inventory.ts
│   │   │   ├── fight.ts
│   │   │   ├── garden.ts
│   │   │   └── ...
│   │   ├── actionHandlers/         # State mutation handlers
│   │   │   ├── garden.ts
│   │   │   ├── combat.ts
│   │   │   ├── inventory.ts
│   │   │   └── upgrades.ts
│   │   ├── app.integration.test.tsx# Integration tests (player flows)
│   │   ├── garden.test.ts          # Domain unit tests
│   │   ├── combat.test.ts
│   │   └── ... (other domain tests)
│   └── assets/                     # Static images, fonts
├── docs/                           # Documentation (see docs/README.md)
├── public/                         # Public assets
├── dist/                           # Build output (generated)
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript config
├── vite.config.ts                  # Build configuration
├── vitest.config.ts                # Test configuration
└── eslint.config.js                # Linter configuration
```

---

## 4. Key npm Scripts

### Development

```bash
npm run dev            # Start dev server with HMR (http://localhost:5173)
npm run build          # Production build (outputs to dist/)
npm run preview        # Preview production build locally
```

### Testing

```bash
npm run test           # Run tests in watch mode (interactive)
npm run test:run       # Run all tests once (235 tests)
npm run test:ui        # Run tests with UI dashboard
npm run test:integration # Run app integration tests only (8 critical flows)
```

### Code Quality

```bash
npm run lint           # Check code style with ESLint
```

### Validation Gates (use before committing)

```bash
npm run test:integration  # Check app flows work
npm run test:run         # Check all unit tests pass
npm run build            # Check TypeScript compiles and build succeeds
```

---

## 5. Development Workflow

### Start development server

```bash
npm run dev
```

Opens http://localhost:5173 with hot reload. Changes save automatically.

### Make a change

1. Edit a file in `src/`
2. Browser automatically reloads
3. Check for TypeScript errors in IDE (red squiggles)
4. Check console for runtime errors

### Before committing

```bash
npm run lint            # Fix any style issues
npm run test:run        # Verify all tests pass
npm run build           # Verify build succeeds
git add .
git commit -m "description"
git push
```

---

## 5.5 Copilot Refactor Guidance Files

This repo includes project-specific Copilot customization files to keep generated code aligned with the refactor architecture.

- Workspace baseline instructions: `copilot-instructions.md`
- Implementation workflow skill: `.github/skills/refactor-implementation/SKILL.md`
- Testing workflow skill: `.github/skills/refactor-testing/SKILL.md`

When using AI-assisted edits for game logic, selectors, migrations, or tests, follow these files first before introducing new patterns.

Quick routing:

| If your task is...                                            | Use this file first                               |
| ------------------------------------------------------------- | ------------------------------------------------- |
| General project-wide implementation alignment                 | `copilot-instructions.md`                         |
| Add/refactor actions, selectors, migrations, or feature logic | `.github/skills/refactor-implementation/SKILL.md` |
| Add unit/integration/determinism/migration tests              | `.github/skills/refactor-testing/SKILL.md`        |

---

## 6. Understanding the Codebase

### The Game State

Entry point: `src/game/GameContext.tsx`

All state is held in a single `GameState` object, initialized from localStorage on app load. Changes are immutable (old state → new state).

State shape (see `src/game/types.ts` for full definition):

```typescript
{
  meta: { version, lastUpdate }
  resources: { gold, gems, mana, energy }
  stats: { combatLevel, hp, mana, ... }
  playerProgress: { level, xp, unlockedFeatures }
  combat: { currentEnemy, clicks, spellCooldowns, ... }
  inventory: { items, equippedSlots, ... }
  character: { activeClass, classProgress, spellSlots, ... }
  upgrades: { purchased, tree, ... }
  garden: { fields, crops, automationTools, unlocks, ... }
}
```

### The Tick Loop

Every 1 second, GameContext runs a "tick" that:

1. Advances idle gold/mana generation
2. Advances garden automation (harvester, planter, sprinkler, seedmaker)
3. Advances combat simulation
4. Saves state to localStorage
5. Triggers React re-renders

### Action Handlers

UI doesn't mutate state directly. Instead:

1. Component calls an action (e.g., `dispatch({ type: "combat/click" })`)
2. GameContext's reducer calls the appropriate action handler (`src/game/actionHandlers/combat.ts`)
3. Handler returns new state
4. React re-renders with new state

Example:

```typescript
// In a component
const { dispatch } = useGame();
dispatch({ type: "inventory/equip", itemId: "sword-1" });

// In actionHandlers/inventory.ts
case "inventory/equip":
  return applyEquipItemAction(state, action);
```

### Selectors

Components shouldn't read raw state. Use selectors to derive values:

```typescript
// In a component
import { inventoryByType } from "../game/selectors/inventory";
const weapons = inventoryByType(gameState, "weapon");

// In selectors/inventory.ts
export function inventoryByType(state: GameState, type: string) {
  return state.inventory.items.filter((item) => item.type === type);
}
```

**Why?** If you ever refactor the state shape, you only need to update the selector, not every component using it.

### Tests

Tests are collocated with source files:

```
src/game/
├── engine.ts             # Source
├── engine.test.ts        # Tests for engine
├── garden.ts
├── garden.test.ts
└── ...
```

Run tests with:

```bash
npm run test:run          # All tests
npm run test:run -- garden.test.ts  # Single file
npm run test              # Watch mode (interactive)
```

---

## 7. Adding a New Feature (Checklist)

When adding a new game feature, follow this pattern:

### 1. Update State Shape

- Add new properties to GameState in `src/game/types.ts`
- Update default state in `src/game/state.ts` or initial values

### 2. Create Action Handler

- Add action type in `types.ts`
- Create handler in `src/game/actionHandlers/newFeature.ts`
- Register in GameContext reducer

### 3. Add Selectors (if derived state)

- Create `src/game/selectors/newFeature.ts` if you have derived state
- Export pure functions that calculate values from GameState

### 4. Create Tests

- Add `src/game/newFeature.test.ts`
- Test domain logic in isolation (no React/UI)
- Add determinism test for complex flows

### 5. Add UI Component

- Create `src/components/NewFeature.tsx`
- Use `useGame()` hook to access state and dispatch
- Use selectors to read values
- Call dispatch() on user actions

### 6. Update Storage (if needed)

- If new state needs persistence, update default in `src/game/storage.ts`
- Add migration if changing existing state shape

### 7. Validate

- Run tests: `npm run test:run`
- Run integration tests: `npm run test:integration`
- Run build: `npm run build`

---

## 8. Coding Patterns and Conventions

### State Immutability

**Do:**

```typescript
// Create new object, don't mutate old one
return {
  ...state,
  resources: { ...state.resources, gold: state.resources.gold + 100 },
};
```

**Don't:**

```typescript
state.resources.gold += 100; // Direct mutation
return state;
```

### Pure Functions

Keep domain logic pure (no side effects, no global state):

```typescript
// Good: Pure function
export function calculateDamage(playerStats, enemyArmor) {
  return Math.max(1, playerStats.attack - enemyArmor * 0.5);
}

// Bad: Impure (reads global, has side effects)
export function calculateDamage() {
  const damage = globalPlayerStats.attack - combatEnemy.armor * 0.5;
  console.log("Damage calc"); // Side effect
  return damage;
}
```

### Error Handling

Return new state, don't throw exceptions (in reducers):

```typescript
// Good: Return unchanged state
if (!canAfford(state, cost)) {
  return state; // Silently ignored
}

// Then use a selector to indicate error state
export function canBuyUpgrade(state, upgradeId) {
  const cost = getUpgradeCost(upgradeId);
  return state.resources.gold >= cost;
}

// In component, check before showing "Buy" button
if (!canBuyUpgrade(state, upgradeId)) {
  return <button disabled>Not enough gold</button>;
}
```

### Naming Conventions

- **Action types:** `domain/action` (e.g., `"combat/click"`, `"inventory/equip"`)
- **Action handlers:** `applyXxxAction` (e.g., `applyEquipItemAction`)
- **Selectors:** `getXxx` or `xxxFor` (e.g., `getCombatStats`, `itemsForInventory`)
- **Reducers:** `reduceXxx` (e.g., `reduceInventoryAction`)
- **Types:** PascalCase with descriptive names (e.g., `CombatAction`, `InventoryState`)

---

## 9. Debugging

### Common Issues

**Tests fail:**

1. Run `npm run test:run` to see full error messages
2. Check test file for expected vs. actual
3. Verify test data setup with `createDefaultState()`

**Build fails:**

1. Check TypeScript errors: `npm run lint`
2. Verify all imports exist and types are correct
3. Check vite.config.ts and tsconfig.json

**Component not updating:**

1. Verify state is being passed via `useGame()`
2. Ensure you're dispatching the correct action
3. Check that action handler is returning new state, not mutating

**Performance issues:**

1. Check if a selector is recalculating unnecessarily
2. Avoid inline object/function creation in components
3. Use React DevTools Profiler to identify slow renders

### Developer Tools

- **VS Code Extensions:** ESLint, TypeScript support built-in
- **Chrome DevTools:** React DevTools extension helps with component debugging
- **Vitest UI:** Run `npm run test:ui` to see test dashboard

---

## 10. Code Review Checklist

Before pushing, verify:

- ✅ All tests pass (`npm run test:run`)
- ✅ No linting errors (`npm run lint`)
- ✅ Build succeeds (`npm run build`)
- ✅ No mutations to existing state (use pure functions)
- ✅ New state shape has default value in types.ts and storage.ts
- ✅ Tests include happy path, error cases, and edge cases
- ✅ Selectors used for derived state (no computed values in reducer)
- ✅ Action handlers follow established pattern
- ✅ UI components use useGame() and dispatch correctly

---

## 11. Next Steps

1. **Read the game architecture:** [current-architecture-and-flows.md](docs/current-architecture-and-flows.md)
2. **Understand design patterns:** [REFACTOR-HISTORY.md](docs/REFACTOR-HISTORY.md) (Key Architectural Outcomes section)
3. **Explore the code:** Start in `src/game/types.ts` (TypeScript types), then `src/game/GameContext.tsx` (initialization)
4. **Pick a feature to modify:** Find a small action handler and extend it, or find a selector and add derived values
5. **Contribute:** Make a change, run all validation gates, push your branch

---

**Questions?** Check [docs/README.md](docs/README.md) for documentation index.
