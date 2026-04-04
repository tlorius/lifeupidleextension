# Documentation Overview

This folder contains all project documentation, organized by purpose.

---

## 🎯 START HERE

### For understanding the current system:

1. **[current-architecture-and-flows.md](current-architecture-and-flows.md)** ← **Read this first**
   - System overview and entry points
   - Domain model and data structures
   - All player use cases and game flows
   - Testing and coverage approach
   - Architectural constraints

2. **[REFACTOR-HISTORY.md](REFACTOR-HISTORY.md)** ← For context on how we got here
   - Summary of 18 refactoring phases
   - Key architectural outcomes (Action Handlers, Selectors, Code-Splitting, Determinism Tests)
   - How to use the established patterns
   - Phase statistics and validation summary

---

## 📚 Core Design Documentation

- **[codebase-improvement-audit.md](codebase-improvement-audit.md)**
  - Baseline code metrics and hotspots
  - Priority improvements (P0-P3)
  - Refactor recommendations for long-term maintainability

- **[class-system-plan.md](class-system-plan.md)**
  - Class system architecture and requirements
  - File layout and core data model
  - Integration points across systems

- **[upgrades-architecture-audit.md](upgrades-architecture-audit.md)**
  - Upgrade tree structure and rules
  - Purchase logic and unlock dependencies
  - UI representation patterns

- **[RUNTIME-CONFIG-GUIDE.md](RUNTIME-CONFIG-GUIDE.md)**
  - Where combat/progression/garden/upgrades config fields are defined
  - Which modules consume runtime config values today
  - How reload works in-app and what requires reset vs live reload
  - Checklist for adding new runtime-configurable settings safely

---

## ⚠️ GAPS IN CURRENT DOCUMENTATION

See **[DOCUMENTATION-COMPLETENESS-AUDIT.md](DOCUMENTATION-COMPLETENESS-AUDIT.md)** for:

- What documentation exists (strengths)
- What's missing for independent code expansion (gaps)
- Recommendations for the next documentation to create
- Assessment of refactor phase file consolidation

**Current status:** 60% complete (architecture documented, but practical guides for expansion are missing)

---

## 🏛️ Archived Documentation

**[archive/](archive/)**

Contains detailed phase-by-phase refactoring documentation from all 18 phases. Kept for historical reference and decision-making context.

Each phase file includes:

- Phase goals and scope
- Detailed slices (sub-tasks)
- Completion evidence with validation gates
- Measured outcomes (test counts, coverage, build times)

**Use when:** You want to understand why a specific architectural decision was made, or see the full validation evidence for a refactor.

---

## 📖 How to Use This Documentation

### I want to add a new feature

→ Read `codebase-improvement-audit.md` (P0 recommendations)  
→ Then read relevant section in `current-architecture-and-flows.md`  
→ Then check `archive/` if you need detailed pattern examples

### I want to understand the class system

→ Read `class-system-plan.md`  
→ See `current-architecture-and-flows.md` section 5.4 (Character Flow)

### I want to understand game rules and balance

→ Read `current-architecture-and-flows.md` section 6 (Data and Rule Invariants)  
→ Check source files in `src/game/` for implementation details

### I want to know what refactoring was done

→ Read `REFACTOR-HISTORY.md` (consolidated summary)  
→ Check `archive/refactor-phase-*.md` files for details on specific phases

### I want to improve code quality

→ Read `codebase-improvement-audit.md` (priority improvements)  
→ Check `REFACTOR-HISTORY.md` section on Key Architectural Outcomes (patterns to follow)

---

## 🔗 Documentation in Root

**[README.md](../README.md)** — Project setup and build instructions (⚠️ Needs update)

---

## 📝 Quick Status

| Aspect                  | Status        | Details                                                                  |
| ----------------------- | ------------- | ------------------------------------------------------------------------ |
| Architecture            | ✅ Complete   | System overview, domain model, all flows documented                      |
| Design Decisions        | ✅ Complete   | Refactor history and phase evidence preserved                            |
| Getting Started         | ⚠️ Incomplete | README is template; setup guide needed                                   |
| Patterns & Conventions  | ⚠️ Incomplete | Action Handlers, Selectors documented in phases; need consolidated guide |
| Feature Expansion Guide | ❌ Missing    | No step-by-step "how to add a feature" guide yet                         |
| Game Rules Reference    | ⚠️ Partial    | Rules in architecture doc; formulas scattered in source                  |
| State Shape Reference   | ❌ Missing    | No GameState schema or visual diagram                                    |
| Module Reference        | ⚠️ Incomplete | Described in architecture; no detailed module guide                      |
| Testing Strategy        | ✅ Complete   | Coverage baseline and test posture documented                            |
| Performance Notes       | ✅ Complete   | Bundle metrics and code-splitting documented                             |

---

## 🎯 Recommended Next Documentation

Based on completeness audit (see [DOCUMENTATION-COMPLETENESS-AUDIT.md](DOCUMENTATION-COMPLETENESS-AUDIT.md)):

**Priority 1 (Essential for independent expansion):**

1. Create `DEVELOPER-SETUP.md` (project initialization, structure, conventions)
2. Create `GAME-STATE-REFERENCE.md` (GameState shape, schema, and structure)
3. Create `PATTERNS-AND-CONVENTIONS.md` (how to write handlers, selectors, tests)
4. Create `EXPANDING-THE-GAME.md` (feature addition checklist and walkthroughs)

**Priority 2 (Helpful for understanding design):** 5. Create `GAME-SYSTEMS-REFERENCE.md` (deep dives on each major system) 6. Create `MODULE-GUIDE.md` (which file does what, when to modify)

**Priority 3 (Nice-to-have context):** 7. Archive phase files and maintain single consolidated history ✅ **DONE** 8. Create debugging guide and common pitfalls

---

**Last updated:** 2026-03-27  
**Status:** Architecture and design decisions fully documented; practical expansion guides to be added
