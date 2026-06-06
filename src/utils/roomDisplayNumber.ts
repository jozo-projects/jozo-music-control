const ROOM_DISPLAY_MAP: Record<string, string> = {
  "1": "001",
  "2": "002",
  "3": "003",
  "4": "101",
  "5": "102",
  "6": "103",
  "7": "104",
  "8": "105",
  "9": "201",
  "10": "202",
  "11": "203",
  "12": "204",
};

export const getRoomDisplayNumber = (roomId: string): string | null =>
  ROOM_DISPLAY_MAP[roomId] ?? null;
