import type { CharacterState, ClassId } from "./types";
import {
  CLASS_SWITCH_GEM_COST,
  CLASS_UNLOCK_LEVEL,
  createEmptyClassProgress,
} from "./types";
import type { GameState } from "../types";

const CLASS_IDS: ClassId[] = [
  "berserker",
  "sorceress",
  "farmer",
  "archer",
  "idler",
  "tamer",
];

export function createDefaultCharacterState(): CharacterState {
  return {
    activeClassId: null,
    availableSkillPoints: 0,
    classProgress: {
      berserker: createEmptyClassProgress(),
      sorceress: createEmptyClassProgress(),
      farmer: createEmptyClassProgress(),
      archer: createEmptyClassProgress(),
      idler: createEmptyClassProgress(),
      tamer: createEmptyClassProgress(),
    },
    lastClassSwapAt: 0,
    idleCheckIn: {
      streakDays: 0,
      lastCheckInDayKey: null,
    },
  };
}

export function isClassSystemUnlocked(level: number): boolean {
  return level >= CLASS_UNLOCK_LEVEL;
}

export function canSwitchClass(
  state: GameState,
  targetClassId: ClassId,
): boolean {
  if (!isClassSystemUnlocked(state.playerProgress.level)) return false;
  if (state.character.activeClassId === targetClassId) return false;
  return (state.resources.gems ?? 0) >= CLASS_SWITCH_GEM_COST;
}

export function switchClass(
  state: GameState,
  targetClassId: ClassId,
): GameState {
  if (!canSwitchClass(state, targetClassId)) return state;

  return {
    ...state,
    resources: {
      ...state.resources,
      gems: (state.resources.gems ?? 0) - CLASS_SWITCH_GEM_COST,
    },
    character: {
      ...state.character,
      activeClassId: targetClassId,
      lastClassSwapAt: Date.now(),
    },
  };
}

export function freeRespecClass(state: GameState, classId: ClassId): GameState {
  const classProgress = state.character.classProgress[classId];
  if (!classProgress) return state;

  const refundedPoints = classProgress.spentPoints;
  if (
    refundedPoints <= 0 &&
    Object.keys(classProgress.unlockedNodeRanks).length === 0
  ) {
    return state;
  }

  return {
    ...state,
    character: {
      ...state.character,
      availableSkillPoints:
        state.character.availableSkillPoints + refundedPoints,
      classProgress: {
        ...state.character.classProgress,
        [classId]: {
          ...createEmptyClassProgress(),
          selectedSpellIds: [...classProgress.selectedSpellIds],
        },
      },
    },
  };
}

export function ensureCharacterStateShape(state: GameState): GameState {
  const fallback = createDefaultCharacterState();
  const input = state.character;

  if (!input) {
    return {
      ...state,
      character: fallback,
    };
  }

  const mergedClassProgress = { ...fallback.classProgress };
  for (const classId of CLASS_IDS) {
    const existing = input.classProgress?.[classId];
    mergedClassProgress[classId] = {
      ...createEmptyClassProgress(),
      ...existing,
      unlockedNodeRanks: {
        ...(existing?.unlockedNodeRanks ?? {}),
      },
      selectedSpellIds: Array.from(
        { length: 8 },
        (_, index) => existing?.selectedSpellIds?.[index] ?? null,
      ),
    };
  }

  return {
    ...state,
    character: {
      activeClassId: input.activeClassId ?? null,
      availableSkillPoints: Math.max(
        0,
        Math.floor(input.availableSkillPoints ?? 0),
      ),
      classProgress: mergedClassProgress,
      lastClassSwapAt: input.lastClassSwapAt ?? 0,
      idleCheckIn: {
        streakDays: Math.max(0, Math.floor(input.idleCheckIn?.streakDays ?? 0)),
        lastCheckInDayKey: input.idleCheckIn?.lastCheckInDayKey ?? null,
      },
    },
  };
}
