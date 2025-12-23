import referralGiftGif from "@/assets/gif/referral_gift.gif";
import { useGift } from "@/contexts/GiftContext";
import { useClaimGift } from "@/hooks/useGiftMutations";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

const GiftModal: React.FC = () => {
  const { isModalOpen, closeGiftModal, scheduleId, markAsClaimed, isClaimed, claimedGift } = useGift();
  const { mutate: claimGift, isPending, isSuccess, data: claimResult } =
    useClaimGift();
  const [showResult, setShowResult] = useState(false);

  // Gift hiển thị (ưu tiên kết quả claim mới nhất)
  const displayedGift = claimResult || claimedGift;

  // Reset state khi modal đóng
  useEffect(() => {
    if (!isModalOpen) {
      setShowResult(false);
    }
  }, [isModalOpen]);

  // Nếu đã claim rồi, hiển thị kết quả ngay khi mở modal
  useEffect(() => {
    if (isModalOpen && isClaimed && claimedGift) {
      setShowResult(true);
    }
  }, [isModalOpen, isClaimed, claimedGift]);

  // Hiển thị kết quả sau khi claim thành công
  useEffect(() => {
    if (isSuccess && claimResult) {
      setShowResult(true);
      markAsClaimed(claimResult);
    }
  }, [isSuccess, claimResult, markAsClaimed]);

  const handleClaimGift = () => {
    if (scheduleId) {
      claimGift({ scheduleId });
    }
  };

  const handleClose = () => {
    if (!isPending) {
      closeGiftModal();
      setShowResult(false);
    }
  };

  if (!isModalOpen) return null;

  return ReactDOM.createPortal(
    <>
      <style>{`
        @keyframes giftPop {
          0% { transform: scale(0.85); opacity: 0; }
          60% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .gift-pop {
          animation: giftPop 650ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-origin: center;
        }
      `}</style>
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        onClick={handleClose}
      >
        <div
          className="w-full md:w-3/4 lg:w-1/2 xl:w-1/3 p-6 max-h-[90vh] overflow-y-auto bg-black bg-opacity-70 backdrop-blur-md rounded-lg relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          {!isPending && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
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
          )}
          
          {/* Content */}
          {!showResult ? (
            <div className="flex flex-col items-center justify-center py-8">
              {/* Hiển thị GIF quà tặng */}
              <div className="mb-6 relative">
                <img
                  src={referralGiftGif}
                  alt="Quà tặng"
                  className="w-64 h-64 object-contain"
                />
                {isPending && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                    <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Claim Button */}
              {!isPending && (
                <button
                  onClick={handleClaimGift}
                  disabled={isPending || !scheduleId}
                  className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mở quà
                </button>
              )}
            </div>
          ) : (
            // Kết quả sau khi claim thành công
            <div className="flex flex-col items-center justify-center py-8 relative">
              {displayedGift && (
                <div className="relative z-10 flex flex-col items-center w-full space-y-4 text-white">
                  <div className="text-center space-y-1">
                    <p className="text-sm text-gray-200">Nhận quà thành công!</p>
                    <h3 className="text-2xl font-bold">{displayedGift.name}</h3>
                    {displayedGift.type && (
                      <p className="text-xs text-gray-300 uppercase tracking-wide">
                        {displayedGift.type.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>

                  {/* Hiển thị hình ảnh quà ở giữa */}
                  {displayedGift.image && (
                    <div className="mb-2 flex justify-center w-full">
                      <img
                        src={displayedGift.image}
                        alt={displayedGift.name}
                      className="w-full max-w-[820px] max-h-[520px] h-auto object-contain rounded-lg shadow-lg gift-pop"
                      />
                    </div>
                  )}

                  {/* Hiển thị items nếu là loại snacks_drinks */}
                  {displayedGift.type === "snacks_drinks" &&
                    displayedGift.items &&
                    displayedGift.items.length > 0 && (
                      <div className="w-full mb-1">
                        <div className="space-y-2">
                          {displayedGift.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-white bg-opacity-20 rounded-lg"
                            >
                              <div className="flex flex-col">
                                <span className="text-white font-medium">{item.name}</span>
                                {item.category && (
                                  <span className="text-xs text-gray-200">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-white font-semibold">
                                  x{item.quantity}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
              
              {/* Nút đóng */}
              <button
                onClick={handleClose}
                className="relative z-10 mt-6 bg-white bg-opacity-20 text-white px-6 py-2 rounded-full font-semibold hover:bg-opacity-30 transition-colors"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default GiftModal;

