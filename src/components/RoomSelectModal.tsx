import { ROOM_OPTIONS } from "@/constant/rooms";
import { setBoundRoomId } from "@/utils/boundRoomId";
import { getRoomDisplayNumber } from "@/utils/roomDisplayNumber";
import { setStoredPinVerification } from "@/utils/roomPin";
import { toast } from "@/components/ToastContainer";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useLocation, useSearchParams } from "react-router-dom";

interface RoomSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RoomSelectModal: React.FC<RoomSelectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const syncFullscreen = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
      };
      setIsFullscreen(
        Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement),
      );
    };

    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen);
    syncFullscreen();

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen);
    };
  }, []);

  const toggleFullscreen = async () => {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
    };
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };

    try {
      if (isFullscreen) {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else {
          await doc.webkitExitFullscreen?.();
        }
      } else if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else {
        await el.webkitRequestFullscreen?.();
      }
    } catch {
      toast.error("Không thể bật chế độ toàn màn hình");
    }
  };

  const handleSelectRoom = (room: string) => {
    setBoundRoomId(room);
    setStoredPinVerification(room);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("roomId", room);
    const qs = nextParams.toString();
    const path = `${location.pathname}${qs ? `?${qs}` : ""}${location.hash}`;
    window.location.replace(path);
  };

  if (!isOpen) return null;

  if (typeof document === "undefined") return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[125] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Chọn phòng"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/10 bg-gray-900 p-6 text-white shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/70">
              Room selection
            </p>
            <h2 className="mt-1 text-2xl font-bold">Chọn phòng để tiếp tục</h2>
            <p className="mt-2 text-sm text-white/60">
              Chọn phòng bạn đang sử dụng
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/10"
            aria-label="Đóng chọn phòng"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {ROOM_OPTIONS.map((room) => (
            <button
              key={room}
              type="button"
              onClick={() => handleSelectRoom(room)}
              className={`rounded-xl border py-3 font-semibold transition-colors ${
                roomId === room
                  ? "border-primary bg-primary-hover text-primary-foreground"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              Phòng {getRoomDisplayNumber(room) ?? room}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 font-semibold transition-colors hover:bg-white/10"
            aria-label={
              isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              {isFullscreen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                />
              )}
            </svg>
            {isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 font-semibold transition-colors hover:bg-white/10"
            aria-label="Tải lại trang"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M2.985 19.644l3.181-3.183m0 0 3.182 3.183m-3.182-3.183v-4.991"
              />
            </svg>
            Tải lại trang
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default RoomSelectModal;
