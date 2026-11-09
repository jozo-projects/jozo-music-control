// @vitest-environment jsdom
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DeviceAuthorizationGate from "./DeviceAuthorizationGate";
import { getActiveDeviceProof } from "@/utils/deviceAuthorization";

const mocks = vi.hoisted(() => ({ params: new URLSearchParams("roomId=1"), post: vi.fn() }));
vi.mock("react-router-dom", () => ({ useSearchParams: () => [mocks.params] }));
vi.mock("@/hooks/useRoomIdGuard", () => ({ useRoomIdGuard: vi.fn() }));
vi.mock("@/components/RoomSelectModal", () => ({ default: () => <div>ROOM_PICKER</div> }));
vi.mock("@/utils/http", () => ({ default: { post: mocks.post } }));

let root: Root;
let container: HTMLDivElement;
let mounts: number;
let unmounts: number;
function Child() {
  useEffect(() => { mounts++; return () => { unmounts++; }; }, []);
  return <div>OPERATIONS</div>;
}
const render = async () => { await act(async () => { root.render(<DeviceAuthorizationGate><Child /></DeviceAuthorizationGate>); }); };
const poll = async () => { await act(async () => { await vi.advanceTimersByTimeAsync(7000); }); };
const response = (status: string) => ({ data: { status } });
const network = () => Object.assign(new Error("offline"), { isAxiosError: true, request: {} });
const httpError = (status: number) => Object.assign(new Error("HTTP error"), { isAxiosError: true, response: { status } });

beforeEach(() => {
  vi.stubEnv("VITE_DEVICE_AUTHORIZATION", "true");
  vi.useFakeTimers();
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  mocks.params = new URLSearchParams("roomId=1");
  mocks.post.mockReset();
  mocks.post.mockResolvedValueOnce({ data: { id: 1, createdAt: "now", expiresAt: "later" } });
  mounts = 0; unmounts = 0;
  container = document.createElement("div"); document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers(); vi.unstubAllEnvs();
});

describe("device authorization runtime", () => {
  it("keeps the mounted child and proof across transient failures, then blocks revocation", async () => {
    mocks.post.mockResolvedValueOnce(response("approved"))
      .mockRejectedValueOnce(network()).mockRejectedValueOnce(httpError(503))
      .mockResolvedValueOnce(response("approved")).mockResolvedValueOnce(response("revoked"));
    await render();
    const proof = getActiveDeviceProof();
    expect(proof).toBeTruthy(); expect(mounts).toBe(1);
    await poll(); await poll();
    expect(container.textContent).toContain("OPERATIONS");
    expect(getActiveDeviceProof()).toBe(proof);
    expect(mounts).toBe(1); expect(unmounts).toBe(0);
    await poll(); await poll();
    expect(container.textContent).toContain("thu hồi");
    expect(getActiveDeviceProof()).toBeUndefined(); expect(unmounts).toBe(1);
  });
  it("fails closed on initial network failure and later approves", async () => {
    mocks.post.mockRejectedValueOnce(network()).mockResolvedValueOnce(response("approved"));
    await render();
    expect(container.textContent).toContain("Không thể kết nối");
    expect(mounts).toBe(0); expect(getActiveDeviceProof()).toBeUndefined();
    await poll(); expect(container.textContent).toContain("OPERATIONS");
  });
  it.each([401, 403])("closes an approved gate on HTTP %s", async (status) => {
    mocks.post.mockResolvedValueOnce(response("approved")).mockRejectedValueOnce(httpError(status));
    await render(); await poll();
    expect(container.textContent).not.toContain("OPERATIONS");
    expect(getActiveDeviceProof()).toBeUndefined(); expect(unmounts).toBe(1);
  });
  it("preserves approval on timeout and closes on expiry", async () => {
    mocks.post.mockResolvedValueOnce(response("approved"))
      .mockRejectedValueOnce(Object.assign(new Error("timeout"), { isAxiosError: true, code: "ECONNABORTED" }))
      .mockResolvedValueOnce(response("expired"));
    await render(); const proof = getActiveDeviceProof();
    expect(mocks.post.mock.calls[0][2].timeout).toBe(10000);
    await poll(); expect(getActiveDeviceProof()).toBe(proof); expect(unmounts).toBe(0);
    await poll(); expect(container.textContent).toContain("hết hạn"); expect(getActiveDeviceProof()).toBeUndefined();
  });
  it("closes if another tab changes the request before a network failure", async () => {
    mocks.post.mockResolvedValueOnce(response("approved")).mockRejectedValueOnce(network());
    await render(); localStorage.removeItem("jozo.device-authorization.control.1");
    await poll(); expect(getActiveDeviceProof()).toBeUndefined(); expect(unmounts).toBe(1);
  });
  it("mounts immediately without polling when disabled", async () => {
    vi.stubEnv("VITE_DEVICE_AUTHORIZATION", "false");
    await render(); expect(mounts).toBe(1); expect(mocks.post).not.toHaveBeenCalled();
  });
  it("does not carry approval or a late response across rooms", async () => {
    let resolveOld!: (value: unknown) => void;
    mocks.post.mockResolvedValueOnce(response("approved"))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
      .mockRejectedValue(network());
    await render(); await poll();
    mocks.params = new URLSearchParams("roomId=2"); await render();
    expect(getActiveDeviceProof()).toBeUndefined(); expect(container.textContent).not.toContain("OPERATIONS");
    await act(async () => { resolveOld(response("approved")); });
    expect(getActiveDeviceProof()).toBeUndefined(); expect(container.textContent).not.toContain("OPERATIONS");
  });
});
