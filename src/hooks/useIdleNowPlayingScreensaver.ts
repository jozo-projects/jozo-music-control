import { IDLE_TIMEOUT_MS } from "@/constant/nowPlaying";
import { useEffect } from "react";

type UseIdleNowPlayingScreensaverArgs = {
  enabled: boolean;
  isExpanded: boolean;
  expand: () => void;
};

export const useIdleNowPlayingScreensaver = ({
  enabled,
  isExpanded,
  expand,
}: UseIdleNowPlayingScreensaverArgs) => {
  useEffect(() => {
    if (!enabled || isExpanded) return;

    let timeoutId = window.setTimeout(expand, IDLE_TIMEOUT_MS);

    const bump = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(expand, IDLE_TIMEOUT_MS);
    };

    const options: AddEventListenerOptions = { capture: true, passive: true };
    window.addEventListener("pointerdown", bump, options);
    window.addEventListener("keydown", bump, options);
    window.addEventListener("scroll", bump, options);
    window.addEventListener("wheel", bump, options);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("pointerdown", bump, options);
      window.removeEventListener("keydown", bump, options);
      window.removeEventListener("scroll", bump, options);
      window.removeEventListener("wheel", bump, options);
    };
  }, [enabled, isExpanded, expand]);
};
