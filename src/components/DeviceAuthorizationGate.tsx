import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import io from "socket.io-client";
import { useSearchParams } from "react-router-dom";
import RoomSelectModal from "@/components/RoomSelectModal";
import RoomPinModal from "@/components/RoomPinModal";
import { logo } from "@/assets/images";
import { useRoomIdGuard } from "@/hooks/useRoomIdGuard";
import http from "@/utils/http";
import { checkAuthorization, createProof, InvalidStoredAuthorization, isRequestCurrent, loadOrCreateRequest, replaceInvalidStoredAuthorization, saveRequest, saveRequestIfCurrent, setActiveDeviceProof, validRoomId, type AuthorizationStatus } from "@/utils/deviceAuthorization";

const post = (url: string, body: unknown) => http.post(url, body, { skipErrorToast: true, timeout: 10000 } as never);

function isTransientFailure(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (error.response) return error.response.status === 429 || (error.response.status >= 500 && error.response.status < 600);
  return !!error.request || error.code === "ECONNABORTED" || error.code === "ETIMEDOUT" || error.code === "ERR_NETWORK";
}

function RoomGate({ room, children }: { room: number; children: ReactNode }) {
  const [status, setStatus] = useState<AuthorizationStatus | "loading" | "network" | "error" | "room-not-found" | "invalid-storage">("loading");
  const [retry, setRetry] = useState(0);
  const [invalidStorage, setInvalidStorage] = useState<InvalidStoredAuthorization | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [roomSelectOpen, setRoomSelectOpen] = useState(false);
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
    let halted = false;
    setInvalidStorage(null);
    setStorageError(false);
    setActiveDeviceProof();
    setStatus("loading");
    const trigger = () => {
      if (stopped || halted) return;
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
                (url.protocol === "https:" || url.protocol === "http:" || url.protocol === "wss:")) {
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
        if (error instanceof InvalidStoredAuthorization || (axios.isAxiosError(error) && error.response?.status === 404 && error.response.data?.error === "ROOM_NOT_FOUND")) {
          halted = true;
          dirty = false;
          socket?.disconnect();
          approvedProof = undefined;
          setActiveDeviceProof();
          if (error instanceof InvalidStoredAuthorization) {
            setInvalidStorage(error);
            setStatus("invalid-storage");
          } else {
            setStatus("room-not-found");
          }
          return;
        }
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
        if (!stopped && !halted) {
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
    <button type="button" onClick={() => setPinOpen(true)} aria-label="Chọn phòng" className="absolute right-4 top-4 p-2">
      <img src={logo} alt="Jozo" className="h-10 w-auto object-contain" />
    </button>
    <h1 className="text-2xl">Xác thực thiết bị phòng {room}</h1>
    {status === "loading" && <p>Đang kiểm tra yêu cầu...</p>}
    {status === "pending" && <p>Vui lòng chờ quản trị viên phê duyệt thiết bị.</p>}
    {status === "network" && <p>Không thể kết nối. Đang thử lại...</p>}
    {status === "error" && <p>Không thể xác thực thiết bị. Đang thử lại...</p>}
    {status === "room-not-found" && <p>Không tìm thấy phòng. Bấm logo Jozo để chọn lại phòng.</p>}
    {status === "invalid-storage" && <>
      <p className="text-center">Dữ liệu xác thực trên thiết bị bị lỗi. Cần gửi yêu cầu cấp quyền mới.</p>
      {storageError && <p className="text-center">Không thể lưu dữ liệu. Vui lòng kiểm tra bộ nhớ trình duyệt hoặc liên hệ nhân viên.</p>}
      <button className="rounded bg-blue-600 px-5 py-3" onClick={() => {
        if (!invalidStorage || !window.confirm("Gửi yêu cầu cấp quyền mới? Quyền cũ không tự bị thu hồi và nhân viên có thể cần xác nhận thay thế thiết bị.")) return;
        try {
          replaceInvalidStoredAuthorization(room, invalidStorage);
          setRetry((v) => v + 1);
        } catch { setStorageError(true); }
      }}>Gửi yêu cầu cấp quyền mới</button>
    </>}
    {(status === "expired" || status === "revoked" || status === "rejected") && <><p>{status === "expired" ? "Yêu cầu đã hết hạn." : status === "rejected" ? "Yêu cầu bị từ chối. Liên hệ nhân viên" : "Quyền thiết bị đã bị thu hồi."}</p><button className="rounded bg-blue-600 px-5 py-3" onClick={() => { try { saveRequest(room, { proof: createProof() }); setRetry((v) => v + 1); } catch { setStatus("network"); } }}>Gửi yêu cầu mới</button></>}
    {pinOpen && <RoomPinModal roomId={String(room)} fixed onClose={() => setPinOpen(false)} onVerified={() => { setPinOpen(false); setRoomSelectOpen(true); }} />}
    <RoomSelectModal isOpen={roomSelectOpen} onClose={() => setRoomSelectOpen(false)} />
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

function InvalidRoom() {
  const [pinOpen, setPinOpen] = useState(false);
  const [roomSelectOpen, setRoomSelectOpen] = useState(false);
  return <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
    <button type="button" onClick={() => setPinOpen(true)} aria-label="Chọn phòng" className="absolute right-4 top-4 p-2">
      <img src={logo} alt="Jozo" className="h-10 w-auto object-contain" />
    </button>
    <p role="alert">Mã phòng không hợp lệ. Vui lòng chọn phòng hợp lệ.</p>
    {pinOpen && <RoomPinModal fixed onClose={() => setPinOpen(false)} onVerified={() => { setPinOpen(false); setRoomSelectOpen(true); }} />}
    <RoomSelectModal isOpen={roomSelectOpen} onClose={() => setRoomSelectOpen(false)} />
  </main>;
}

function EnabledGate({ children }: { children: ReactNode }) {
  const [params] = useSearchParams();
  const raw = params.get("roomId")?.trim() || "";
  // Keep the existing session-bound room restoration and room picker available before sockets mount.
  useRoomIdGuard();
  if (!raw) return <RoomSelectModal isOpen onClose={() => {}} />;
  const room = validRoomId(raw);
  if (!room) return <InvalidRoom />;
  return <RoomGate key={room} room={room}>{children}</RoomGate>;
}
