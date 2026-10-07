import type { QueryClient } from "@tanstack/react-query";

/** Keep the room's queue intact when the backend confirms now-playing was cleared. */
export function clearNowPlayingCache(queryClient: QueryClient, roomId: string) {
  queryClient.setQueryData(
    ["queue", roomId],
    (current: { result: { nowPlaying: unknown; queue: unknown[] } } | undefined) =>
      current
        ? { ...current, result: { ...current.result, nowPlaying: null } }
        : current,
  );
}
