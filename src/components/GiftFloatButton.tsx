import React from "react";
import { useGift } from "@/contexts/GiftContext";

const GiftFloatButton: React.FC = () => {
  const { isGiftEnabled, isClaimed, openGiftModal, claimedGift } = useGift();

  if (!isGiftEnabled) return null;

  return (
    <div className={`fixed bottom-20 right-6 z-30 ${!isClaimed ? "animate-bounce" : ""}`}>
      <button
        onClick={openGiftModal}
        className={`${
          isClaimed
            ? "bg-gradient-to-r from-green-400 to-green-600"
            : "bg-gradient-to-r from-yellow-400 to-orange-500"
        } text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center`}
        title={isClaimed ? "Xem quà đã mở" : "Mở quà"}
      >
        <div className="relative">
          {isClaimed ? (
            // Icon checkmark khi đã mở
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          ) : (
            // Icon hộp quà khi chưa mở
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625v2.625m0 0V21m9-5.25v-4.875C21 5.007 19.993 3 18.75 3h-4.125M3 12.75h18"
                />
              </svg>
              {/* Pulse effect chỉ khi chưa mở */}
              <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-75"></span>
            </>
          )}
        </div>
      </button>
    </div>
  );
};

export default GiftFloatButton;

