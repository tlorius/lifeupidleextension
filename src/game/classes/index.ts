import { archerClass } from "./classes/archer";
import { berserkerClass } from "./classes/berserker";
import { farmerClass } from "./classes/farmer";
import { idlerClass } from "./classes/idler";
import { sorceressClass } from "./classes/sorceress";
import { tamerClass } from "./classes/tamer";
import type { CharacterClassDefinition, ClassId } from "./types";

export const classDefinitions: Record<ClassId, CharacterClassDefinition> = {
  berserker: berserkerClass,
  sorceress: sorceressClass,
  farmer: farmerClass,
  archer: archerClass,
  idler: idlerClass,
  tamer: tamerClass,
};

export const allClassDefinitions: CharacterClassDefinition[] =
  Object.values(classDefinitions);

export function getClassDefinition(
  classId: ClassId,
): CharacterClassDefinition | null {
  return classDefinitions[classId] ?? null;
}

export * from "./types";
export * from "./state";
