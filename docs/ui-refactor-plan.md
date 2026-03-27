# UI Refactor Plan: Reusable Styling and Mobile Usability

## Objective

Reduce inline CSS across the UI by extracting repeated styles into reusable classes/components while preserving current behavior and improving mobile usability where low-risk improvements are clear.

## Audit Summary (Completed)

- Inline style usage is concentrated in modal and panel-heavy files.
- Highest duplicate pattern: modal overlay + modal container + header + close button.
- Many files repeat identical color, spacing, border, and shadow values.
- Mobile handling is inconsistent (`isMobile` props in some modals, fixed values in others).

Top inline-style hotspots by occurrence:

- `src/components/GardenTileDetailModal.tsx` (68)
- `src/components/UpgradesViews.tsx` (59)
- `src/components/ResourcesDisplay.tsx` (50)
- `src/components/ItemDetail.tsx` (48)
- `src/components/Fight.tsx` (33)
- `src/components/Inventory.tsx` (29)

## Reusable UI Targets

1. Modal primitives (highest priority)

- Overlay/backdrop
- Panel shell (sizes, max-height, scroll handling)
- Header row
- Close button

2. Repeated cards/panels

- Standard bordered info card
- Compact row card
- Section separators

3. Repeated micro-utilities

- Text utility styles (`muted`, `subtle`, `label`)
- Repeated grid/flex gap patterns
- Progress bar shell/fill utilities

4. Buttons

- Normalize secondary/ghost styles currently declared inline
- Keep existing semantic button classes (`btn-primary`, `btn-danger`, etc.)

## Multi-Step Execution Plan

### Phase 1: Shared Modal Foundation

- [x] Audit duplicate modal style patterns.
- [x] Add global reusable modal classes in `src/index.css`.
- [x] Create `src/components/ui/ModalShell.tsx` wrapper component.
- [x] Refactor first modal batch to use shared shell:
  - `src/components/ClassSelectModal.tsx`
  - `src/components/SkillTreeModal.tsx`
  - `src/components/SpellSelectModal.tsx`
  - `src/components/GardenCropStorageModal.tsx`
  - `src/components/GardenCropMasteryModal.tsx`
- [x] Validate build and behavior parity.

### Phase 2: Modal Family Expansion

- [ ] Migrate remaining garden/combat/reward modals to shared classes/components.
  - Completed in this slice:
    - `src/components/IdleEarningsModal.tsx`
    - `src/components/TokenRewardModal.tsx`
    - `src/components/GardenSeedBagModal.tsx`
    - `src/components/GardenSeedMakerModal.tsx`
    - `src/components/GardenHarvestModal.tsx`
    - `src/components/GardenRockBreakModal.tsx`
    - `src/components/GardenPlantModal.tsx`
    - `src/components/GardenToolWheelModal.tsx`
    - `src/components/GardenTileDetailModal.tsx`
    - `src/components/FightConsumables.tsx` (`FightConsumableModal`)
    - `src/components/UpgradesViews.tsx` (`UpgradesTreeModal`)
- [ ] Standardize close button and header spacing.
- [ ] Add mobile-safe width/height defaults for all modal shells.

### Phase 3: Common Card/Panel Extraction

- [ ] Extract repeated panel/card classes from high-inline files:
  - `src/components/UpgradesViews.tsx`
  - `src/components/ResourcesDisplay.tsx`
  - `src/components/ItemDetail.tsx`
  - `src/components/Inventory.tsx`
  - `src/components/Fight.tsx`
  - Completed in this slice:
    - Added shared utility classes in `src/index.css`: `.ui-screen-pad`, `.ui-notice-card`, `.ui-notice-card--warning`
    - Applied initial utility-class adoption in `src/components/UpgradesViews.tsx`
    - Migrated `ResourcesDisplay` stats modal overlay/container to shared `ModalShell`
    - Added shared utility classes for stat and detail sections in `src/index.css` (`.ui-resource-*`, `.ui-stats-*`, `.ui-detail-*`, `.ui-full-width-btn`)
    - Migrated repeated stat/card styling blocks in `src/components/ResourcesDisplay.tsx` to utility classes
    - Migrated `src/components/ItemDetail.tsx` to shared `ModalShell` + reusable section/button utility classes
    - Added reusable inventory and comparison/effect card utility classes in `src/index.css`
    - Migrated remaining repeated comparison/effect cards in `src/components/ItemDetail.tsx` to utility classes
    - Migrated inventory filter toolbar, mass-sell toolbar, item cards/chips, and toast shell in `src/components/Inventory.tsx` to utility classes
    - Added reusable fight layout utilities in `src/index.css` (`.ui-fight-*` for player panel, arena shell, attack surface, and toast stack)
    - Migrated structural fight wrapper styles in `src/components/Fight.tsx` to shared classes while keeping dynamic bar widths/effects inline
    - Added reusable view/button/list utilities for upgrades and modal sections in `src/index.css` (`.ui-view-toolbar`, `.ui-inline-toggle-btn`, `.ui-upgrade-*`, `.ui-action-row-end`, `.ui-section-title-16`)
    - Migrated repeated list-card and action-button shells in `src/components/UpgradesViews.tsx` to shared utilities
    - Migrated repeated modal section title/action row shells in `src/components/GardenTileDetailModal.tsx` to shared utilities
    - Added reusable button/list/view utilities for spell/skill/toolwheel surfaces in `src/index.css` (`.ui-spell-*`, `.ui-skill-*`, `.ui-toolwheel-*`, `.ui-section-divider*`, `.ui-grid-gap-4`, `.ui-grid-gap-6`)
    - Migrated repeated spell slot/list/button shells in `src/components/SpellSelectModal.tsx` to shared utilities
    - Migrated repeated skill tree section/list/card/button shells in `src/components/SkillTreeModal.tsx` to shared utilities
    - Migrated repeated tool wheel filter/list/seed-button shells in `src/components/GardenToolWheelModal.tsx` to shared utilities
- [ ] Introduce reusable utility classes for common card and stat-row patterns.

### Phase 4: Layout and Utility Cleanup

- [ ] Replace duplicated inline grid/flex spacing patterns with utility classes.
- [ ] Remove one-off inline style literals where class-based equivalent exists.
- [ ] Keep inline style only for truly dynamic values (e.g., progress widths, conditional color values).
  - Completed in this slice:
    - Replaced additional static inline layout/text literals in `src/components/Fight.tsx` with reusable utility classes
    - Replaced grouped-seed static text style in `src/components/Inventory.tsx` with utility class

### Phase 5: Mobile Usability Pass

- [ ] Ensure modal content remains tappable and scrollable on small screens.
- [ ] Normalize tap target minimum sizes where practical.
- [ ] Improve spacing and typography for narrow widths where currently cramped.
  - Completed in this slice:
    - Added mobile adjustment for combat attack surface min-height in `src/index.css` (`.ui-fight-attack-btn`)
    - Added reusable touch-target utility (`.ui-touch-target`) and applied it to dense controls in `src/components/Inventory.tsx`, `src/components/ItemDetail.tsx`, and `src/components/Fight.tsx`
    - Added responsive wrapping/layout improvements for dense control rows (`.ui-filter-btn`, `.ui-mass-toolbar-*`, `.ui-detail-option-row`)
    - Added mobile-safe toast offsets for inventory and combat toasts (`.ui-toast-fixed`, `.ui-fight-toast-stack`)

### Phase 6: Validation and Regression Guard

- [ ] Run build/test validation.
- [ ] Spot-check core gameplay flows using refactored modal components.
- [ ] Document final reusable class/component inventory.
  - Completed in this slice:
    - Full validation sequence executed successfully:
      - `npm run test:integration`
      - `npm run test:run`
      - `npm run test:coverage`
      - `npm run build`
    - Coverage run completed with overall statement coverage at 91.32%

## Progress Tracker

- Current phase: **Phase 6 (validation and closeout)**
- Completed this session:
  - Inline style hotspot analysis
  - Duplicate modal pattern confirmation across 14 modal files
  - Refactor plan created with prioritized sequence
  - Shared modal utility classes added in `src/index.css`
  - New reusable `ModalShell` component created
  - First five modal files migrated to shared modal foundation
  - Build validation passed (`npm run build`)
  - `ModalShell` extended with overlay style support for z-index parity
  - Additional six modals migrated to shared modal shell
  - Import ordering normalized in migrated garden modal files
  - Build validation passed again (`npm run build`)
  - Build validation passed again after further modal migration (`npm run build`)
  - Garden planting modal migrated to shared modal shell
  - Build validation passed again (`npm run build`)
  - Tool wheel, tile detail, consumable modal, and upgrades tree modal migrated to shared shell
  - Build validation passed again (`npm run build`)
  - Initial card/panel utility extraction started in `UpgradesViews`
  - Build validation passed again after utility-class adoption (`npm run build`)
  - ResourcesDisplay stats modal migrated to shared modal shell
  - Build validation passed again (`npm run build`)
  - Additional shared utility classes added in `src/index.css` for resource chips, stats cards, and detail sections
  - ResourcesDisplay stat cards/labels/dividers migrated from repeated inline styles to shared utility classes
  - ItemDetail modal pair migrated to shared `ModalShell` with reusable section and full-width button classes
  - Build validation passed again after utility extraction (`npm run build`)
  - Additional utility class suite added in `src/index.css` for inventory cards/toolbar/toasts and comparison/effect cards
  - ItemDetail comparison rows and potion effect card migrated to utility classes
  - Inventory tabs, mass-sell controls, item metadata blocks, stat chips, equipped badge, and toast shell migrated to utility classes
  - Build validation passed again after Inventory/ItemDetail extraction (`npm run build`)
  - Fight player header/arena wrappers, attack-surface scaffolding, and toast stack moved to shared utility classes
  - Mobile combat tap area improved with reduced small-screen min-height for attack surface
  - Build validation passed again after Fight extraction (`npm run build`)
  - Mobile/tap-target utility pass applied to dense Inventory and ItemDetail control rows
  - Additional static inline cleanup pass applied in Fight and Inventory
  - Build validation passed again after mobile + cleanup pass (`npm run build`)
  - Full Phase 6 validation sequence passed (integration, test run, coverage, build)
  - Additional build validation passed after upgrades/garden button-list-view extraction (`npm run build`)
  - Additional build validation passed after spell/skill/toolwheel extraction (`npm run build`)
  - Added reusable `ui-rockbreak-*`, `ui-plant-*`, `ui-fight-spells-*`, and `ui-mastery-*` utility families in `src/index.css`
  - Migrated repeated static style shells in `src/components/GardenRockBreakModal.tsx` to `ui-rockbreak-*` classes
  - Migrated repeated static style shells in `src/components/GardenPlantModal.tsx` to `ui-plant-*` classes
  - Migrated repeated static style shells in `src/components/FightSpellsPanel.tsx` to `ui-fight-spells-*` classes
  - Migrated repeated static style shells in `src/components/GardenCropMasteryModal.tsx` to `ui-mastery-*` classes
  - Additional build validation passed after rock break / plant / fight spells / crop mastery extraction (`npm run build`)
  - Drift cleanup applied in `src/components/SkillTreeModal.tsx` by replacing imperative hover style handlers with CSS hover and removing unused node-grouping setup
  - Additional build validation passed after skill tree drift cleanup (`npm run build`)
  - Drift cleanup applied in `src/components/GardenToolWheelModal.tsx` by removing remaining static inline capitalization style into reusable class
  - Additional build validation passed after tool wheel drift cleanup (`npm run build`)
  - Added reusable modal button utility classes in `src/index.css` (`.ui-modal-btn-compact`, `.ui-modal-btn-secondary`, `.ui-modal-btn-primary`, `.ui-modal-btn-danger`)
  - Applied shared modal button utilities in `src/components/GardenSeedMakerModal.tsx`, `src/components/GardenHarvestModal.tsx`, `src/components/FightConsumables.tsx`, `src/components/IdleEarningsModal.tsx`, and `src/components/TokenRewardModal.tsx`
  - Additional build validation passed after modal button consistency pass (`npm run build`)
  - Added reusable small-button utilities in `src/index.css` (`.ui-modal-btn-small`, `.ui-modal-btn-small-danger`)
  - Replaced repeated Garden tile action button constants/usages with shared button utilities in `src/components/GardenTileDetailModal.tsx`
  - Additional build validation passed after Garden tile button cleanup (`npm run build`)
  - Added reusable garden detail card/action/summary utilities in `src/index.css` (`.ui-garden-detail-*`, `.ui-garden-inline-actions*`, `.ui-garden-summary-row*`)
  - Migrated remaining static garden detail and harvest card shells in `src/components/GardenTileDetailModal.tsx` and `src/components/GardenHarvestModal.tsx` to shared garden detail utilities
  - Additional build validation passed after final garden shell cleanup (`npm run build`)
  - Added configurable shared button tone utilities in `src/index.css` (`.ui-btn-tone` + `ui-btn-tone--*` variants)
  - Replaced repeated static garden button color/border blocks in `src/components/GardenTileDetailModal.tsx` and `src/components/GardenHarvestModal.tsx` with shared tone classes
  - Validation passed after configurable button extraction (`npm run test:integration`, `npm run build`)
  - Added configurable non-button tile chip defaults in `src/index.css` (`.ui-tile-chip` + `ui-tile-chip--*` variants)
  - Replaced repeated ADJ/HARV/PLAN chip inline styles in `src/components/GardenTiles.tsx` with shared tile chip classes
  - Validation passed after garden tile chip extraction (`npm run test:integration`, `npm run build`)
  - Added extracted shared ui component `src/components/ui/ToneButton.tsx` for configurable tone button composition
  - Added extracted shared ui component `src/components/ui/TileChip.tsx` for reusable garden tile status chips
  - Migrated tone-based garden actions in `src/components/GardenTileDetailModal.tsx` and confirm action in `src/components/GardenHarvestModal.tsx` to `ToneButton`
  - Migrated garden crop tile ADJ/HARV/PLAN chip rendering in `src/components/GardenTiles.tsx` to `TileChip`
  - Validation passed after shared ui component extraction (`npm run test:integration`, `npm run build`)
  - Added extracted shared ui component `src/components/ui/ActionRow.tsx` for reusable end-aligned modal action rows
  - Added extracted shared ui component `src/components/ui/GardenDetailCard.tsx` for reusable garden detail surface wrappers
  - Migrated repeated garden detail wrappers and action rows in `src/components/GardenTileDetailModal.tsx` and `src/components/GardenHarvestModal.tsx` to `ActionRow` and `GardenDetailCard`
  - Fixed a transient parse regression introduced during the wrapper migration and revalidated cleanly
  - Validation passed after wrapper ui component extraction (`npm run test:integration`, `npm run build`)
  - Added extracted shared ui component `src/components/ui/SectionTitle.tsx` for repeated section-level modal headings
  - Added extracted shared ui component `src/components/ui/WrapActions.tsx` for reusable wrapped inline action groups
  - Migrated repeated garden modal headings and inline action-list wrappers in `src/components/GardenTileDetailModal.tsx` and `src/components/GardenHarvestModal.tsx` to `SectionTitle` and `WrapActions`
  - Validation passed after heading/action-list ui component extraction (`npm run test:integration`, `npm run build`)
  - Added extracted shared ui component `src/components/ui/ModalHeader.tsx` for reusable modal heading/action framing
  - Added extracted shared ui component `src/components/ui/ProgressBar.tsx` for reusable track/fill progress rendering
  - Migrated storage/mastery modal headers in `src/components/GardenCropStorageModal.tsx` and `src/components/GardenCropMasteryModal.tsx` to `ModalHeader`
  - Migrated crop/storage/mastery progress rendering in `src/components/GardenTileDetailModal.tsx`, `src/components/GardenCropStorageModal.tsx`, and `src/components/GardenCropMasteryModal.tsx` to `ProgressBar`
  - Fixed a transient `ModalHeader` prop-name typing conflict (`title` vs native HTML attribute) and revalidated cleanly
  - Validation passed after header/progress ui component extraction (`npm run test:integration`, `npm run build`)
  - Added extracted shared ui component `src/components/ui/NoticeCard.tsx` for reusable neutral/warning notice messaging
  - Added extracted shared ui component `src/components/ui/ValueRow.tsx` for reusable left/right summary rows
  - Migrated upgrade-tree empty/info notices in `src/components/UpgradesViews.tsx` to `NoticeCard`
  - Migrated garden storage and harvest summary rows in `src/components/GardenCropStorageModal.tsx` and `src/components/GardenHarvestModal.tsx` to `ValueRow`
  - Validation passed after notice/value-row ui component extraction (`npm run test:integration`, `npm run build`)
  - Added extracted shared ui component `src/components/ui/PanelSurface.tsx` for reusable framed gradient panel containers
  - Migrated repeated fight/progression panel shells in `src/components/FightDpsPanel.tsx`, `src/components/FightPanels.tsx`, and `src/components/PlayerProgressTile.tsx` to `PanelSurface`
  - Extended `ProgressBar` adoption into `src/components/PlayerProgressTile.tsx` for the player XP fill track
  - Validation passed after panel-surface extraction (`npm run test:integration`, `npm run build`)

- Next in queue:
  - Spot-check key gameplay flows in UI (inventory actions, fight loop, garden modal interactions) for visual parity
  - Document final reusable class/component inventory
  - Close out residual notes after parity check if any narrow-screen regressions appear

## Final Reusable Inventory (Current)

Shared in `src/index.css` and used across refactored surfaces:

Shared components in `src/components/ui`:

- `ModalShell.tsx`
- `ToneButton.tsx`
- `TileChip.tsx`
- `ActionRow.tsx`
- `GardenDetailCard.tsx`
- `SectionTitle.tsx`
- `WrapActions.tsx`
- `ModalHeader.tsx`
- `ProgressBar.tsx`
- `NoticeCard.tsx`
- `ValueRow.tsx`
- `PanelSurface.tsx`

- Modal foundation:
  - `.ui-modal-overlay`, `.ui-modal-panel`, `.ui-modal-header`, `.ui-modal-title`, `.ui-modal-close`
  - `.ui-modal-btn-compact`, `.ui-modal-btn-secondary`, `.ui-modal-btn-primary`, `.ui-modal-btn-danger`
  - `.ui-modal-btn-small`, `.ui-modal-btn-small-danger`
  - `.ui-btn-tone`, `.ui-btn-tone--*`
- Core layout/notice utilities:
  - `.ui-screen-pad`, `.ui-notice-card`, `.ui-notice-card--warning`, `.ui-card`
  - `.ui-tile-chip`, `.ui-tile-chip--*`
- Detail/stat utilities:
  - `.ui-detail-section`, `.ui-detail-title`, `.ui-detail-divider-top`, `.ui-full-width-btn`, `.ui-touch-target`
  - `.ui-stats-modal-header`, `.ui-stats-heading`, `.ui-stats-grid`, `.ui-label-muted`, `.ui-text-meta`, `.ui-text-caption`
  - `.ui-stat-section-title`, `.ui-stat-section-list`
- Resource/stats cards:
  - `.ui-resource-wrap`, `.ui-resource-row`, `.ui-resource-chip`, `.ui-resource-toggle`
  - `.ui-card-tonal`, `.ui-card-tonal-alt`, `.ui-composition-card`
- Item comparison/effects:
  - `.ui-compare-card`, `.ui-compare-slot-title`, `.ui-compare-grid`, `.ui-compare-row`, `.ui-effect-card`
  - `.ui-detail-option-row`
- Inventory utilities:
  - `.ui-filter-row`, `.ui-filter-btn`, `.ui-empty-message`, `.ui-list-stack`
  - `.ui-mass-toolbar`, `.ui-mass-toolbar-label`, `.ui-mass-toolbar-actions`, `.ui-summary-muted`
  - `.ui-inventory-card`, `.ui-item-icon`, `.ui-item-content`, `.ui-item-header-row`
  - `.ui-item-meta`, `.ui-item-set-meta`, `.ui-item-total`, `.ui-grouped-seed-note`
  - `.ui-item-stat-chip-row`, `.ui-item-stat-chip`, `.ui-item-hint`, `.ui-item-warning`, `.ui-equipped-badge`
  - `.ui-toast-fixed`, `.ui-btn-compact-danger`
- Fight utilities:
  - `.ui-fight-screen`, `.ui-fight-player-card`, `.ui-fight-row`, `.ui-fight-row-with-bottom`
  - `.ui-fight-level-label`, `.ui-fight-stats-toggle`, `.ui-fight-micro-label`, `.ui-fight-micro-label--below`, `.ui-fight-micro-label--above`
  - `.ui-fight-bar-shell`, `.ui-fight-player-hp-shell`, `.ui-fight-player-xp-shell`
  - `.ui-fight-expanded-grid`, `.ui-fight-grid-full-note`
  - `.ui-fight-arena`, `.ui-fight-arena-header`, `.ui-fight-title`, `.ui-fight-kind-badge`
  - `.ui-fight-enemy-hp`, `.ui-fight-enemy-hp-shell`
  - `.ui-fight-attack-btn`, `.ui-fight-attack-top-labels`, `.ui-fight-sprite-row`, `.ui-fight-sprite-stack`
  - `.ui-fight-toast-stack`, `.ui-fight-toast`
  - `.ui-fight-spells-*`
- Garden modal families:
  - `.ui-garden-detail-*`, `.ui-garden-inline-actions*`, `.ui-garden-summary-row*`
  - `.ui-rockbreak-*`, `.ui-plant-*`, `.ui-toolwheel-*`
- Mastery utilities:
  - `.ui-mastery-*`

## Residual Risk Notes

- Remaining inline styles in high-inline components are primarily dynamic values (width %, conditional colors, drop-shadows, and animation-driven positions) where class extraction would reduce clarity.
- Manual visual parity spot-check in running UI is still recommended for final signoff of inventory/fight/garden interaction density on narrow screens.

## Issues and Open Questions Log

### Active Issues

- None currently blocking.

### New Non-Blocking Notes

- Vite emitted a dedicated chunk for `ModalShell` during build output; this is expected from modularization and not a functional issue.

### Resolved Issues

- `rg` not available in environment; switched to built-in workspace search and `grep`.

### Questions for Product/UX Decisions

- None yet. If a UI behavior choice requires changing visuals/functionality beyond parity, ask user before proceeding.
