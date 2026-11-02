import type { InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import http from "./http";

vi.mock("@/components/ToastContainer", () => ({ toast: { error: vi.fn() } }));

const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => ({
  data: { result: {} },
  status: 200,
  statusText: "OK",
  headers: {},
  config,
}));
beforeEach(() => adapter.mockClear());

describe("room API guard", () => {
  it.each(["", " ", "undefined", "null"])(
    "rejects a missing room ID before dispatch: %s",
    async (roomId) => {
      await expect(
        http.post(`/room-music/${roomId}/queue`, {}, { adapter }),
      ).rejects.toThrow("Vui lòng chọn phòng trước khi thao tác.");
      expect(adapter).not.toHaveBeenCalled();
    },
  );

  it.each(["/room-music/1/queue", "/room-music/2/play-next-song"])(
    "preserves valid room operations: %s",
    async (url) => {
      await http.post(url, {}, { adapter });
      expect(adapter).toHaveBeenCalledOnce();
    },
  );

  it("does not block room-independent catalog reads", async () => {
    await http.get("/room-music/music-categories", { adapter });
    expect(adapter).toHaveBeenCalledOnce();
  });
});
