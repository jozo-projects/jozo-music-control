import { useRoomPin } from "@/contexts/RoomPinContext";
import { getRoomDisplayNumber } from "@/utils/roomDisplayNumber";
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

interface RoomPinModalProps {
  roomId?: string;
  fixed?: boolean;
  onClose?: () => void;
  onVerified?: () => void;
}

const RoomPinModal: React.FC<RoomPinModalProps> = ({
  roomId,
  fixed = false,
  onClose,
  onVerified,
}) => {
  const { verifyPin } = useRoomPin();
  const [pin, setPin] = useState(["", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const roomDisplayNumber = roomId ? getRoomDisplayNumber(roomId) : null;
  const isComplete = pin.every((digit) => digit !== "");

  const handleInputChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (pinError) setPinError("");

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    if (!isComplete) return;

    const success = verifyPin(pin.join(""));
    if (!success) {
      setPinError("Mã PIN không đúng. Vui lòng thử lại.");
      setPin(["", "", "", ""]);
      inputRefs.current[0]?.focus();
      return;
    }
    onVerified?.();
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (typeof document === "undefined") return null;

  return ReactDOM.createPortal(
    <div
      className={`${fixed ? "fixed" : "absolute"} inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-pin-title"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl bg-gray-900 p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Đóng"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-wide text-white/60">
            Xác thực phòng
          </p>
          <h2 id="room-pin-title" className="mt-1 text-xl font-bold">
            {roomDisplayNumber
              ? `Nhập mã PIN — Phòng ${roomDisplayNumber}`
              : "Nhập mã PIN"}
          </h2>
          <p className="mt-2 text-sm text-white/70">
            Nhập mã PIN nhân viên để sử dụng hệ thống
          </p>
        </div>

        <div className="mb-2 flex justify-center gap-3">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => {
                handleKeyDown(e, index);
                if (e.key === "Enter" && isComplete) handleSubmit();
              }}
              className={`h-14 w-14 rounded-xl border-2 bg-white/5 text-center text-2xl font-bold focus:outline-none focus:ring-2 ${
                pinError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                  : "border-white/20 focus:border-primary focus:ring-primary/30"
              }`}
            />
          ))}
        </div>

        {pinError && (
          <p className="mb-4 text-center text-sm font-medium text-red-400">
            {pinError}
          </p>
        )}

        {!pinError && <div className="mb-4" />}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isComplete}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Xác nhận
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default RoomPinModal;
