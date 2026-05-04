import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import BookingSongList from "./BookingSongList";

interface BookingCodeModalProps {
  isOpen: boolean;
  onClose: VoidFunction;
  roomId: string;
}

const BookingCodeModal: React.FC<BookingCodeModalProps> = ({
  isOpen,
  onClose,
  roomId,
}) => {
  const [bookingCode, setBookingCode] = useState(["", "", "", ""]);
  const [isCodeComplete, setIsCodeComplete] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if code is complete
  useEffect(() => {
    const code = bookingCode.join("");
    setIsCodeComplete(code.length === 4);
  }, [bookingCode]);

  // Reset input khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setBookingCode(["", "", "", ""]);
      setIsCodeComplete(false);
    }
  }, [isOpen]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    // Update current input
    const newCode = [...bookingCode];
    newCode[index] = value;
    setBookingCode(newCode);

    // Auto focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !bookingCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleClear = () => {
    setBookingCode(["", "", "", ""]);
    setIsCodeComplete(false);
    inputRefs.current[0]?.focus();
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full md:w-3/4 lg:w-1/2 xl:w-1/3 rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Nhập mã đặt box</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* PIN Input */}
        <div className="flex justify-center items-center space-x-3 mb-6">
          {bookingCode.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-14 h-14 text-center text-2xl font-bold rounded-lg border-2 border-gray-300 focus:border-primary focus:outline-none ring-primary/25 focus:ring-2"
              autoFocus={index === 0}
            />
          ))}
        </div>

        {/* Show song list if code is complete */}
        {isCodeComplete && (
          <BookingSongList
            bookingCode={bookingCode.join("")}
            roomId={roomId}
            onClose={onClose}
            onClearCode={handleClear}
          />
        )}
      </div>
    </div>,
    document.body,
  );
};

export default BookingCodeModal;
