import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { clearNowPlayingCache } from "./clearNowPlayingCache";

describe("clearNowPlayingCache", () => {
  it("clears the ended song in the room cache while preserving its queue and response metadata", () => {
    const client = new QueryClient();
    const room = ["queue", "room-1"];
    const otherRoom = ["queue", "room-2"];
    const current = {
      success: true,
      result: {
        nowPlaying: { video_id: "ended", title: "HLS song" },
        queue: [{ video_id: "up-next" }],
      },
    };
    client.setQueryData(room, current);
    client.setQueryData(otherRoom, current);

    clearNowPlayingCache(client, "room-1");

    expect(client.getQueryData(room)).toEqual({
      ...current,
      result: { nowPlaying: null, queue: current.result.queue },
    });
    expect(client.getQueryData(otherRoom)).toEqual(current);
  });

  it("does not create a partial response when the room has not loaded yet", () => {
    const client = new QueryClient();
    clearNowPlayingCache(client, "room-1");
    expect(client.getQueryData(["queue", "room-1"])).toBeUndefined();
  });
});
