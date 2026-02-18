import liXiImg from "@/assets/images/gifts/li-xi.png";
import { useGift } from "@/contexts/GiftContext";
import React from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const GiftFloatButton: React.FC = () => {
  const { isGiftEnabled, isClaimed } = useGift();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  if (!isGiftEnabled || location.pathname === "/gift") return null;

  const goToGift = () => {
    const query = searchParams.toString();
    navigate(`/gift${query ? `?${query}` : ""}`);
  };

  // Hình lì xì — nằm giữa màn hình (thay ChucMungNamMoi bằng li-xi.png)
  const centerButton = (
    <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto">
        <button
          onClick={goToGift}
          className="bg-transparent text-white p-2 rounded-full shadow-2xl transition-all duration-200 flex items-center justify-center"
          title="Mở quà"
        >
          <div className="relative">
            <img
              src={liXiImg}
              alt="Bấm vào để nhận lì xì"
              className="w-72 h-72 object-contain"
            />
          </div>
        </button>
      </div>
    </div>
  );

  // Icon "đã mở" — nằm góc (bottom-right)
  const cornerButton = (
    <div className="fixed bottom-32 right-6 z-30">
      <button
        onClick={goToGift}
        className="bg-gradient-to-r from-green-400 to-green-600 text-white p-2 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center"
        title="Xem quà đã mở"
      >
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
      </button>
    </div>
  );

  return isClaimed ? cornerButton : centerButton;
};

export default GiftFloatButton;
