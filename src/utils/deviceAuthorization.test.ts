import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProof, validRoomId, loadOrCreateRequest, checkAuthorization, sameBackend, saveRequest, saveRequestIfCurrent } from "./deviceAuthorization";

beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v) });
});

describe("device authorization", () => {
  it("creates canonical 32-byte proofs and validates room IDs", () => {
    const proof = createProof();
    expect(proof).toMatch(/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/);
    expect(validRoomId("12")).toBe(12);
    for (const value of ["", "0", "1.5", "1e2", "-1", "abc"]) expect(validRoomId(value)).toBeNull();
  });
  it("persists proof before request, reuses it after failure and refresh, and rotates only explicitly", async () => {
    const post = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ data: { id: "id", createdAt: "now", expiresAt: "later" } });
    await expect(loadOrCreateRequest(1, post)).rejects.toThrow();
    const first = post.mock.calls[0][1].proof;
    const request = await loadOrCreateRequest(1, post);
    expect(request.proof).toBe(first);
    expect((await loadOrCreateRequest(1, post)).proof).toBe(first);
    expect(post).toHaveBeenCalledTimes(2);
    expect((await loadOrCreateRequest(1, post, true)).proof).not.toBe(first);
  });
  it("limits credentials to the configured backend origin", () => {
    vi.stubGlobal("window", { location: { href: "https://app.example/" } });
    expect(sameBackend("wss://api.example/socket", "https://api.example/v1")).toBe(true);
    expect(sameBackend("https://evil.example/", "https://api.example/")).toBe(false);
    expect(sameBackend("http://api.example/", "https://api.example/")).toBe(false);
  });
  it("does not overwrite another tab's replacement proof", () => {
    const old = { proof: createProof() };
    saveRequest(1, old);
    saveRequest(1, { proof: createProof() });
    expect(() => saveRequestIfCurrent(1, old)).toThrow();
  });
  it("checks status using the persisted credential", async () => {
    const post = vi.fn().mockResolvedValueOnce({ data: { id: 3, createdAt: "a", expiresAt: "b" } }).mockResolvedValueOnce({ data: { status: "revoked" } });
    const request = await loadOrCreateRequest(9, post);
    expect(await checkAuthorization(9, request, post)).toBe("revoked");
    expect(post.mock.calls[1][1]).toEqual({ roomId: 9, clientType: "control", id: 3, proof: request.proof });
  });
});
