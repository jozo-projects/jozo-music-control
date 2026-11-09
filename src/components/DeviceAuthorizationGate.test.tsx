import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DeviceAuthorizationGate from "./DeviceAuthorizationGate";
const state = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock("react-router-dom", () => ({ useSearchParams: () => [state.params] }));
vi.mock("@/hooks/useRoomIdGuard", () => ({ useRoomIdGuard: vi.fn() }));
vi.mock("@/components/RoomSelectModal", () => ({ default: () => <div>ROOM_PICKER</div> }));
vi.mock("@/utils/http", () => ({ default: { post: vi.fn() } }));
afterEach(() => { vi.unstubAllEnvs(); state.params = new URLSearchParams(); });
describe("opt-in authorization gate", () => {
  it("leaves existing behavior unchanged by default", () => {
    vi.stubEnv("VITE_DEVICE_AUTHORIZATION", "false");
    expect(renderToStaticMarkup(<DeviceAuthorizationGate>OPERATIONS</DeviceAuthorizationGate>)).toContain("OPERATIONS");
  });
  it("shows the room picker when no room is selected", () => {
    vi.stubEnv("VITE_DEVICE_AUTHORIZATION", "true");
    const html = renderToStaticMarkup(<DeviceAuthorizationGate>OPERATIONS</DeviceAuthorizationGate>);
    expect(html).toContain("ROOM_PICKER");
    expect(html).not.toContain("OPERATIONS");
  });
  it.each(["abc", "0", "1.5"])("rejects invalid room %s before operational children", (room) => {
    vi.stubEnv("VITE_DEVICE_AUTHORIZATION", "true"); state.params.set("roomId", room);
    const html = renderToStaticMarkup(<DeviceAuthorizationGate>OPERATIONS</DeviceAuthorizationGate>);
    expect(html).toContain("không hợp lệ"); expect(html).not.toContain("OPERATIONS");
  });
  it("does not mount operational children before status verification", () => {
    vi.stubEnv("VITE_DEVICE_AUTHORIZATION", "true"); state.params.set("roomId", "1");
    const html = renderToStaticMarkup(<DeviceAuthorizationGate>OPERATIONS</DeviceAuthorizationGate>);
    expect(html).toContain("Đang kiểm tra"); expect(html).not.toContain("OPERATIONS");
  });
});
