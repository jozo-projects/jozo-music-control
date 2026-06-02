const BOUND_ROOM_ID_KEY = "jozo-bound-room-id";

export const getBoundRoomId = (): string | null =>
  sessionStorage.getItem(BOUND_ROOM_ID_KEY);

export const setBoundRoomId = (roomId: string): void => {
  sessionStorage.setItem(BOUND_ROOM_ID_KEY, roomId);
};

export const clearBoundRoomId = (): void => {
  sessionStorage.removeItem(BOUND_ROOM_ID_KEY);
};
