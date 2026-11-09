import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import io from "socket.io-client";
import { useSearchParams } from "react-router-dom";
import RoomSelectModal from "@/components/RoomSelectModal";
import { useRoomIdGuard } from "@/hooks/useRoomIdGuard";
import http from "@/utils/http";
import { checkAuthorization, createProof, isRequestCurrent, loadOrCreateRequest, saveRequest, saveRequestIfCurrent, setActiveDeviceProof, validRoomId, type AuthorizationStatus } from "@/utils/deviceAuthorization";

const post = (url: string, body: unknown) => http.post(url, body, { skipErrorToast: true, timeout: 10000 } as never);

function isTransientFailure(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (error.response) return error.response.status === 429 || (error.response.status >= 500 && error.response.status < 600);
  return !!error.request || error.code === "ECONNABORTED" || error.code === "ETIMEDOUT" || error.code === "ERR_NETWORK";
}

function RoomGate({ room, children }: { room: number; children: ReactNode }) {
  const [status, setStatus] = useState<AuthorizationStatus | "loading" | "network" | "error">("loading");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let socket: ReturnType<typeof io> | undefined;
    let socketKey = "";
    let running = false;
    let dirty = false;
    let blockedUntil = 0;
    let current: AuthorizationStatus | "loading" | "network" | "error" = "loading";
    let approvedProof: string | undefined;
    setActiveDeviceProof();
    setStatus("loading");
    const trigger = () => {
      if (stopped) return;
      if (Date.now() < blockedUntil) {
        clearTimeout(timer);
        timer = setTimeout(trigger, blockedUntil - Date.now());
        return;
      }
      dirty = true;
      clearTimeout(timer);
      if (!running) void poll();
    };
    const poll = async () => {
      running = true;
      dirty = false;
      try {
        const request = await loadOrCreateRequest(room, post);
        if (stopped) return;
        if (approvedProof && request.proof !== approvedProof) {
          approvedProof = undefined;
          current = "loading";
          setActiveDeviceProof();
          setStatus(current);
        }
        const key = JSON.stringify([request.id, request.proof]);
        if (key !== socketKey) {
          socket?.disconnect();
          socket = undefined;
          socketKey = key;
          const endpoint = import.meta.env.VITE_SOCKET_URL;
          try {
            const url = new URL(endpoint);
            if (!url.username && !url.password && !url.search && !url.hash &&
                (url.protocol === "https:" || url.protocol === "http:")) {
              socket = io(`${url.origin}/device-authorization`, {
                auth: { roomId: room, clientType: "control", id: request.id, proof: request.proof },
                transports: ["websocket"], forceNew: true,
              });
              socket.on("connect", trigger);
              socket.on("device_authorization_changed", trigger);
            }
          } catch { /* Polling remains available without a trusted configured socket. */ }
        }
        const result = await checkAuthorization(room, request, post);
        if (stopped || dirty) return;
        saveRequestIfCurrent(room, { ...request, status: result });
        current = result;
        approvedProof = current === "approved" ? request.proof : undefined;
        setActiveDeviceProof(approvedProof);
        setStatus(current);
      } catch (error) {
        if (stopped) return;
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          const seconds = Number(error.response.headers?.["retry-after"] ?? error.response.data?.retryAfterSeconds);
          blockedUntil = Date.now() + (Number.isFinite(seconds) && seconds > 0 ? seconds : 30) * 1000;
          dirty = false;
        } else if (dirty) return;
        const transient = isTransientFailure(error);
        if (!(transient && current === "approved" && approvedProof && isRequestCurrent(room, approvedProof))) {
          approvedProof = undefined;
          setActiveDeviceProof();
          current = transient ? "network" : "error";
          setStatus(current);
        }
      } finally {
        running = false;
        if (!stopped) {
          if (dirty) void poll();
          else timer = setTimeout(trigger, Math.max(30000, blockedUntil - Date.now()));
        }
      }
    };
    trigger();
    return () => { stopped = true; clearTimeout(timer); socket?.disconnect(); setActiveDeviceProof(); };
  }, [room, retry]);
  if (status === "approved") return <>{children}</>;
  return <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 p-6" role="status">
    <h1 className="text-2xl">Xác thực thiết bị phòng {room}</h1>
    {status === "loading" && <p>Đang kiểm tra yêu cầu...</p>}
    {status === "pending" && <p>Vui lòng chờ quản trị viên phê duyệt thiết bị.</p>}
    {status === "network" && <p>Không thể kết nối. Đang thử lại...</p>}
    {status === "error" && <p>Không thể xác thực thiết bị. Đang thử lại...</p>}
    {(status === "expired" || status === "revoked" || status === "rejected") && <><p>{status === "expired" ? "Yêu cầu đã hết hạn." : status === "rejected" ? "Yêu cầu bị từ chối. Liên hệ nhân viên" : "Quyền thiết bị đã bị thu hồi."}</p><button className="rounded bg-blue-600 px-5 py-3" onClick={() => { try { saveRequest(room, { proof: createProof() }); setRetry((v) => v + 1); } catch { setStatus("network"); } }}>Gửi yêu cầu mới</button></>}
  </main>;
}

export default function DeviceAuthorizationGate({ children }: { children: ReactNode }) {
  // Until a valid response explicitly disables the gate, keep it enabled.
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    let stopped = false;
    let running = false;
    let dirty = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    const refresh = () => {
      if (stopped) return;
      clearTimeout(timer);
      if (running) { dirty = true; return; }
      void poll();
    };
    const poll = async () => {
      running = true;
      dirty = false;
      try {
        const { data } = await http.get("/room-device-authorization/config", {
          skipErrorToast: true, timeout: 10000, signal: controller.signal,
          params: { _: Date.now() },
        } as never);
        if (!data || typeof data.enabled !== "boolean") throw new Error("Invalid authorization config");
        if (!stopped && !dirty) setEnabled(data.enabled);
      } catch {
        if (!stopped) setEnabled(true);
      } finally {
        running = false;
        if (!stopped) {
          if (dirty) refresh();
          else timer = setTimeout(refresh, 30000);
        }
      }
    };
    window.addEventListener("focus", refresh);
    refresh();
    return () => { stopped = true; clearTimeout(timer); controller.abort(); window.removeEventListener("focus", refresh); };
  }, []);
  if (enabled === null) return <main role="status">Đang kiểm tra cấu hình thiết bị...</main>;
  if (!enabled) return <>{children}</>;
  return <EnabledGate>{children}</EnabledGate>;
}

function EnabledGate({ children }: { children: ReactNode }) {
  const [params] = useSearchParams();
  const raw = params.get("roomId")?.trim() || "";
  // Keep the existing session-bound room restoration and room picker available before sockets mount.
  useRoomIdGuard();
  if (!raw) return <RoomSelectModal isOpen onClose={() => {}} />;
  const room = validRoomId(raw);
  if (!room) return <main role="alert">Mã phòng không hợp lệ. Vui lòng chọn phòng hợp lệ.</main>;
  return <RoomGate key={room} room={room}>{children}</RoomGate>;
}
