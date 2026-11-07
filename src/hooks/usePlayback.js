import { useEffect, useState, useSyncExternalStore } from "react";
import { createPlaybackController } from "../engine/playbackController.js";
export function usePlayback() {
  const [controller] = useState(() => createPlaybackController());
  const state = useSyncExternalStore(controller.subscribe, controller.getState);
  useEffect(() => () => controller.clear(), [controller]);
  return { state, controller };
}
