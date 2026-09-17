/** Máy RAM thấp (vd. Mastel Tab 10A 4GB) bị lag nặng với backdrop-filter. */
export function applyReducedGlassIfNeeded(): void {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const isAndroid = /Android/i.test(nav.userAgent);
  const lowMemory =
    typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const lowCpu =
    typeof nav.hardwareConcurrency === "number" &&
    nav.hardwareConcurrency <= 4;
  const saveData = Boolean(nav.connection?.saveData);
  const reducedTransparency = window.matchMedia(
    "(prefers-reduced-transparency: reduce)",
  ).matches;

  if (lowMemory || saveData || reducedTransparency || (isAndroid && lowCpu)) {
    document.documentElement.classList.add("reduced-glass");
  }
}
