import { beforeAll } from "vitest";
import { initializeConfig } from "./game/configLoader";

/**
 * Global vitest setup: Initialize game config from defaults before running tests.
 * This ensures all tests have access to the runtime config system.
 */
beforeAll(() => {
  initializeConfig();
});
