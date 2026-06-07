import { useRoomPin } from "@/contexts/RoomPinContext";
import { clearBoundRoomId } from "@/utils/boundRoomId";
import { getRoomDisplayNumber } from "@/utils/roomDisplayNumber";
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

interface RoomPinModalProps {
  roomId: string;
}

const RoomPinModal: React.FC<RoomPinModalProps> = ({ roomId }) => {
  const { verifyPin } = useRoomPin();
  const [pin, setPin] = useState(["", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
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

  const handleClose = () => {
    clearBoundRoomId();
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("roomId");
    const qs = nextParams.toString();
    const path = `${location.pathname}${qs ? `?${qs}` : ""}${location.hash}`;
    navigate(path, { replace: true });
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

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-gray-900 p-6 text-white shadow-2xl mx-4">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
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
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-wide text-white/60">
            Xác thực phòng
          </p>
          <h2 className="mt-1 text-xl font-bold">
            Nhập mã PIN — Phòng {roomDisplayNumber}
          </h2>
          <p className="mt-2 text-sm text-white/70">
            Nhập mã PIN để tiếp tục sử dụng hệ thống
          </p>
        </div>

        <div className="mb-2 flex justify-center gap-3">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="password"
              inputMode="numeric"
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

        <button
          type="button"
          onClick={handleClose}
          className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 py-3 font-semibold transition-colors hover:bg-white/10"
        >
          Đóng
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default RoomPinModal;
