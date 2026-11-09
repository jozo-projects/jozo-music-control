export type AuthorizationStatus = "pending" | "approved" | "expired" | "revoked" | "rejected";
export interface DeviceRequest { proof: string; id?: string | number; createdAt?: string; expiresAt?: string; status?: AuthorizationStatus }
type Post = (url: string, body: any) => Promise<{ data: any }>;
const key = (room: number) => `jozo.device-authorization.control.${room}`;

export function validRoomId(value: string): number | null {
  if (!/^[0-9]+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
export function createProof(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function saveRequest(room: number, request: DeviceRequest) {
  localStorage.setItem(key(room), JSON.stringify(request));
}
export function isRequestCurrent(room: number, proof: string): boolean {
  try {
    const stored = localStorage.getItem(key(room));
    return !!stored && (JSON.parse(stored) as DeviceRequest).proof === proof;
  } catch { return false; }
}
export function saveRequestIfCurrent(room: number, request: DeviceRequest) {
  const stored = localStorage.getItem(key(room));
  if (!stored || (JSON.parse(stored) as DeviceRequest).proof !== request.proof) throw new Error("Authorization changed in another tab");
  saveRequest(room, request);
}
export async function loadOrCreateRequest(room: number, post: Post, rotate = false): Promise<DeviceRequest> {
  let request: DeviceRequest | undefined;
  if (!rotate) {
    const stored = localStorage.getItem(key(room));
    if (stored) {
      const parsed = JSON.parse(stored) as DeviceRequest;
      if (!/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(parsed.proof)) throw new Error("Invalid stored authorization");
      request = parsed;
    }
  }
  if (!request) {
    request = { proof: createProof() };
    saveRequest(room, request); // Persist before sending, including when the response is lost.
  }
  if (request.id == null) {
    const { data } = await post("/room-device-authorization/requests", { roomId: room, clientType: "control", proof: request.proof });
    if (data.id == null || !data.createdAt || !data.expiresAt) throw new Error("Invalid authorization response");
    request = { ...request, id: data.id, createdAt: data.createdAt, expiresAt: data.expiresAt };
    saveRequestIfCurrent(room, request);
  }
  return request;
}
export async function checkAuthorization(room: number, request: DeviceRequest, post: Post): Promise<AuthorizationStatus> {
  const { data } = await post("/room-device-authorization/status", { roomId: room, clientType: "control", id: request.id, proof: request.proof });
  if (!["pending", "approved", "expired", "revoked", "rejected"].includes(data.status)) throw new Error("Invalid authorization status");
  return data.status;
}

// Only populated while an approved gate is mounted; never read directly from URLs.
let activeProof: string | undefined;
export const setActiveDeviceProof = (proof?: string) => { activeProof = proof; };
export const getActiveDeviceProof = () => activeProof;
export function sameBackend(target: string, base: string): boolean {
  try {
    const normalize = (value: string) => {
      const url = new URL(value, window.location.href);
      if (url.protocol === "wss:") url.protocol = "https:";
      if (url.protocol === "ws:") url.protocol = "http:";
      return url.origin;
    };
    return normalize(target) === normalize(base);
  } catch { return false; }
}
