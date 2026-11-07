import { useEffect, useState, useSyncExternalStore } from "react";
import { createRaceController } from "../race/raceController.js";
export function useRace() {
  const [controller] = useState(() => createRaceController());
  const state = useSyncExternalStore(controller.subscribe, controller.getState);
  useEffect(() => () => controller.clear(), [controller]);
  return { state, controller };
}
