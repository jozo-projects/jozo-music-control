import React from "react";
import { useGift } from "@/contexts/GiftContext";
import referralGiftGif from "@/assets/gif/referral_gift.gif";

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
            : "bg-transparent"
        } text-white p-2 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center`}
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
            // GIF quà tặng khi chưa mở
            <>
              <img
                src={referralGiftGif}
                alt="Quà tặng"
                className="w-16 h-16 object-contain"
              />
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

