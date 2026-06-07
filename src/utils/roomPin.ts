export const DEFAULT_ROOM_PIN = import.meta.env.VITE_ROOM_PIN ?? "8888";

export const isValidRoomPin = (code: string): boolean =>
  code === DEFAULT_ROOM_PIN;
