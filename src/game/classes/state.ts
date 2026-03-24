import type { CharacterState, ClassId } from "./types";
import {
  CLASS_SWITCH_GEM_COST,
  CLASS_UNLOCK_LEVEL,
  createEmptyClassProgress,
} from "./types";
import { archerClass } from "./classes/archer";
import { berserkerClass } from "./classes/berserker";
import { farmerClass } from "./classes/farmer";
import { idlerClass } from "./classes/idler";
import { sorceressClass } from "./classes/sorceress";
import { tamerClass } from "./classes/tamer";
import type { GameState } from "../types";

const classDefinitionsById = {
  berserker: berserkerClass,
  sorceress: sorceressClass,
  farmer: farmerClass,
  archer: archerClass,
  idler: idlerClass,
  tamer: tamerClass,
};

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

export function getClassNodeRank(
  state: GameState,
  classId: ClassId,
  nodeId: string,
): number {
  return Math.max(
    0,
    state.character.classProgress[classId].unlockedNodeRanks[nodeId] ?? 0,
  );
}

export function getActiveClassNodeRank(
  state: GameState,
  nodeId: string,
): number {
  const activeClassId = state.character.activeClassId;
  if (!activeClassId) return 0;
  return getClassNodeRank(state, activeClassId, nodeId);
}

export function canUpgradeClassNode(
  state: GameState,
  classId: ClassId,
  nodeId: string,
): boolean {
  if (!isClassSystemUnlocked(state.playerProgress.level)) return false;
  if (state.character.availableSkillPoints <= 0) return false;

  const classDef = classDefinitionsById[classId] ?? null;
  if (!classDef) return false;

  const nodeDef = classDef.nodes.find((node) => node.id === nodeId);
  if (!nodeDef) return false;

  const currentRank = getClassNodeRank(state, classId, nodeId);
  if (currentRank >= nodeDef.maxRank) return false;

  const prerequisites = nodeDef.prerequisites ?? [];
  return prerequisites.every((requiredNodeId) => {
    const requiredRank = getClassNodeRank(state, classId, requiredNodeId);
    return requiredRank > 0;
  });
}

export function upgradeClassNode(
  state: GameState,
  classId: ClassId,
  nodeId: string,
): GameState {
  if (!canUpgradeClassNode(state, classId, nodeId)) return state;

  const classProgress = state.character.classProgress[classId];
  const nextRank = (classProgress.unlockedNodeRanks[nodeId] ?? 0) + 1;

  return {
    ...state,
    character: {
      ...state.character,
      availableSkillPoints: Math.max(
        0,
        state.character.availableSkillPoints - 1,
      ),
      classProgress: {
        ...state.character.classProgress,
        [classId]: {
          ...classProgress,
          spentPoints: classProgress.spentPoints + 1,
          unlockedNodeRanks: {
            ...classProgress.unlockedNodeRanks,
            [nodeId]: nextRank,
          },
        },
      },
    },
  };
}

export function setClassSpellSlot(
  state: GameState,
  classId: ClassId,
  slotIndex: number,
  spellId: string | null,
): GameState {
  if (slotIndex < 0 || slotIndex >= 8) return state;
  const classProgress = state.character.classProgress[classId];
  if (!classProgress) return state;

  const selectedSpellIds = [...classProgress.selectedSpellIds];
  selectedSpellIds[slotIndex] = spellId;

  return {
    ...state,
    character: {
      ...state.character,
      classProgress: {
        ...state.character.classProgress,
        [classId]: {
          ...classProgress,
          selectedSpellIds,
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

function toUtcDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayDiff(previousDayKey: string, nextDayKey: string): number {
  const prev = new Date(`${previousDayKey}T00:00:00Z`).getTime();
  const next = new Date(`${nextDayKey}T00:00:00Z`).getTime();
  const diffMs = Math.max(0, next - prev);
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

export function applyIdlerDailyCheckIn(state: GameState): {
  state: GameState;
  gemsGranted: number;
} {
  if (state.character.activeClassId !== "idler") {
    return { state, gemsGranted: 0 };
  }

  const nowKey = toUtcDayKey(Date.now());
  const idleCheckIn = state.character.idleCheckIn ?? {
    streakDays: 0,
    lastCheckInDayKey: null,
  };

  if (idleCheckIn.lastCheckInDayKey === nowKey) {
    return { state, gemsGranted: 0 };
  }

  let nextStreak = 1;
  if (idleCheckIn.lastCheckInDayKey) {
    const gap = dayDiff(idleCheckIn.lastCheckInDayKey, nowKey);
    nextStreak = gap === 1 ? idleCheckIn.streakDays + 1 : 1;
  }

  const streakNodeRank = getClassNodeRank(state, "idler", "idler_4");
  const gemsGranted = Math.max(
    0,
    Math.floor(8 + nextStreak * (3 + streakNodeRank)),
  );

  return {
    state: {
      ...state,
      resources: {
        ...state.resources,
        gems: (state.resources.gems ?? 0) + gemsGranted,
      },
      character: {
        ...state.character,
        idleCheckIn: {
          streakDays: nextStreak,
          lastCheckInDayKey: nowKey,
        },
      },
    },
    gemsGranted,
  };
}
