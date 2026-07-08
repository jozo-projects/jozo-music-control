export const DEFAULT_ROOM_PIN = import.meta.env.VITE_ROOM_PIN ?? "8888";

export const ROOM_PIN_ENABLED = false;

const PIN_VERIFIED_STORAGE_KEY = "jozo:roomPinVerified";

export const isValidRoomPin = (code: string): boolean =>
  code === DEFAULT_ROOM_PIN;

export const getStoredPinVerification = (roomId?: string): boolean => {
  if (typeof sessionStorage === "undefined") return false;

  try {
    const raw = sessionStorage.getItem(PIN_VERIFIED_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { roomId?: string | null };
    if (!parsed.roomId) return true;
    if (!roomId) return false;
    return parsed.roomId === roomId;
  } catch {
    return false;
  }
};

export const setStoredPinVerification = (roomId?: string): void => {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(
    PIN_VERIFIED_STORAGE_KEY,
    JSON.stringify({ roomId: roomId ?? null }),
  );
};

export const clearStoredPinVerification = (): void => {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(PIN_VERIFIED_STORAGE_KEY);
};
