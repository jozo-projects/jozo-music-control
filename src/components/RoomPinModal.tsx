import { useRoomPin } from "@/contexts/RoomPinContext";
import { getRoomDisplayNumber } from "@/utils/roomDisplayNumber";
import React, { useEffect, useRef, useState } from "react";

interface RoomPinModalProps {
  roomId: string;
}

const RoomPinModal: React.FC<RoomPinModalProps> = ({ roomId }) => {
  const { verifyPin } = useRoomPin();
  const [pin, setPin] = useState(["", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const roomDisplayNumber = getRoomDisplayNumber(roomId);
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
    }
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm touch-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-pin-title"
    >
      <div
        className="relative mx-4 w-full max-w-md touch-auto rounded-2xl bg-gray-900 p-6 text-white shadow-2xl"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-wide text-white/60">
            Xác thực phòng
          </p>
          <h2 id="room-pin-title" className="mt-1 text-xl font-bold">
            Nhập mã PIN — Phòng {roomDisplayNumber}
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
    </div>
  );
};

export default RoomPinModal;
