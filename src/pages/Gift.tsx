import sucKhoeDoiDaoImg from "@/assets/images/gifts/Sức khoẻ dồi dào.png";
import vanSuNhuYImg from "@/assets/images/gifts/Vạn sự như ý.png";
import anKhangThinhVuongImg from "@/assets/images/gifts/An khang thịnh vượng.png";
import tanTaiTanLocImg from "@/assets/images/gifts/Tấn tài tấn lộc.png";
import anVuiTronVenImg from "@/assets/images/gifts/An vui trọn vẹn.png";
import catTuongNhuYImg from "@/assets/images/gifts/Cát tường như ý.png";
import gatHaiThanhCongImg from "@/assets/images/gifts/Gặt hái thành công.png";
import hanhPhucVienManImg from "@/assets/images/gifts/Hạnh phúc viên mãn.png";
import songTronDamMeImg from "@/assets/images/gifts/Sống trọn đam mê.png";
import hanhThongThuanLoiImg from "@/assets/images/gifts/Hanh thông thuận lợi.png";
import mayManDuDayImg from "@/assets/images/gifts/May mắn đủ đầy.png";
import phuQuyCatTuongImg from "@/assets/images/gifts/Phú quý cát tường.png";
import phucLocSongToanImg from "@/assets/images/gifts/Phúc lộc song toàn.png";
import congDanhThuanLoiImg from "@/assets/images/gifts/Công danh thuận lợi.png";
import daiCatDaiLoiImg from "@/assets/images/gifts/Đại cát đại lợi.png";
import { useGift } from "@/contexts/GiftContext";
import { useClaimGift } from "@/hooks/useGiftMutations";
import { useGiftListQuery } from "@/hooks/useGiftQuery";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";

// Câu chúc khi mở quà thành công
const CONGRATS_MESSAGE =
  "Năm 2025 bạn đã cố gắng hết mình — dù có lúc khó khăn hay mệt mỏi, bạn vẫn không bỏ cuộc. Điều đó đáng trân trọng lắm. Sang 2026, chúc bạn một năm khởi sắc, tràn đầy năng lượng và may mắn. Mong năm mới sẽ là năm bùng nổ của bạn — bùng nổ niềm vui, thành công và bình an. Cảm ơn bạn đã đồng hành!";

type RevealCard = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isReal?: boolean;
  isRealPending?: boolean;
  type?: GiftType;
  items?: GiftBundleItem[];
};

type GiftCardProps = {
  card: RevealCard;
  mode: "selection" | "reveal";
  onSelect?: () => void;
  disabled?: boolean;
  bounce?: boolean;
};

const GiftCard = ({
  card,
  mode,
  onSelect,
  disabled,
  bounce,
}: GiftCardProps) => {
  const container = (
    <div
      className={`relative w-full min-w-0 flex flex-col gap-1.5 rounded-xl border p-2 ${
        card.isReal
          ? "border-green-400/80 bg-green-400/10"
          : card.isRealPending
            ? "border-yellow-300/70 bg-yellow-300/5"
            : "border-white/10 bg-white/5"
      } ${mode === "selection" ? "hover:-translate-y-1 transition" : ""}`}
    >
      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg bg-black/10">
        <img
          src={card.image}
          alt={card.name}
          className={`w-full h-full object-cover rounded-lg shadow transition-transform ${
            mode === "reveal"
              ? card.isReal
                ? "real-reveal"
                : card.isRealPending
                  ? "animate-pulse"
                  : "fake-img"
              : ""
          }`}
        />
        {mode === "reveal" && !card.isReal && !card.isRealPending && (
          <span className="pointer-events-none absolute inset-0 rounded-lg bg-black/15" />
        )}
      </div>
      <div className="flex flex-col items-center gap-0.5 text-center">
        <div className="text-xs font-semibold line-clamp-1">{card.name}</div>
        {card.description && (
          <p className="text-[10px] text-gray-300">{card.description}</p>
        )}
      </div>

      {card.isReal && card.type === "snacks_drinks" && card.items && (
        <div className="w-full mt-0.5 space-y-1">
          {card.items.map((item, idx) => (
            <div
              key={`${item.itemId}-${idx}`}
              className="flex items-center justify-between rounded bg-white/10 px-2 py-1"
            >
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-xs truncate">
                  {item.name}
                </span>
                {item.category && (
                  <span className="text-[10px] text-gray-200">
                    {item.category}
                  </span>
                )}
              </div>
              <span className="font-semibold text-xs flex-shrink-0">
                x{item.quantity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (mode === "selection") {
    return (
      <button
        onClick={onSelect}
        disabled={disabled}
        className={`relative ${bounce ? "animate-gift-bounce" : ""} disabled:opacity-60`}
      >
        {container}
      </button>
    );
  }

  return container;
};

const GIFT_STYLES = `
  @keyframes giftPop {
    0% { transform: scale(0.85); opacity: 0; }
    60% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes realRevealGrow {
    0% { transform: scale(0.4); opacity: 0; }
    45% { transform: scale(1.15); opacity: 1; }
    65% { transform: scale(0.92); opacity: 1; }
    85% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  .gift-pop {
    animation: giftPop 650ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    transform-origin: center;
  }
  @keyframes giftBounce {
    0% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
    100% { transform: translateY(0); }
  }
  .animate-gift-bounce {
    animation: giftBounce 1.6s ease-in-out infinite;
  }
  .fake-img {
    filter: grayscale(65%) brightness(0.9);
    opacity: 0.65;
    transform: scale(0.96);
  }
  .real-reveal {
    animation: realRevealGrow 650ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    transform-origin: center;
  }
`;

const Gift: React.FC = () => {
  const navigate = useNavigate();
  const { scheduleId, markAsClaimed, isClaimed, claimedGift, isGiftEnabled } =
    useGift();
  const {
    mutate: claimGift,
    isPending,
    isSuccess,
    data: claimResult,
  } = useClaimGift();

  const { data: giftList, isLoading: isLoadingGifts } = useGiftListQuery();
  const activeGifts = useMemo(
    () => (giftList || []).filter((gift) => gift.isActive !== false),
    [giftList],
  );
  const [shuffledGifts, setShuffledGifts] = useState<Gift[]>([]);

  const shuffleGifts = (gifts: Gift[]) => {
    const arr = [...gifts];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const giftImageMap: Record<string, string> = useMemo(
    () => ({
      "Sức Khỏe Dồi Dào": sucKhoeDoiDaoImg,
      "Sức khoẻ dồi dào": sucKhoeDoiDaoImg,
      "Vạn Sự Như Ý": vanSuNhuYImg,
      "Vạn sự như ý": vanSuNhuYImg,
      "An Khang Thịnh Vượng": anKhangThinhVuongImg,
      "An khang thịnh vượng": anKhangThinhVuongImg,
      "Tấn Tài Tấn Lộc": tanTaiTanLocImg,
      "Tấn tài tấn lộc": tanTaiTanLocImg,
      "An Vui Trọn Vẹn": anVuiTronVenImg,
      "An vui trọn vẹn": anVuiTronVenImg,
      "Cát Tường Như Ý": catTuongNhuYImg,
      "Cát tường như ý": catTuongNhuYImg,
      "Gặt Hái Thành Công": gatHaiThanhCongImg,
      "Gặt hái thành công": gatHaiThanhCongImg,
      "Hạnh Phúc Viên Mãn": hanhPhucVienManImg,
      "Hạnh phúc viên mãn": hanhPhucVienManImg,
      "Sống Trọn Đam Mê": songTronDamMeImg,
      "Sống trọn đam mê": songTronDamMeImg,
      "Hạnh Thông Thuận Lợi": hanhThongThuanLoiImg,
      "Hanh thông thuận lợi": hanhThongThuanLoiImg,
      "Hạnh thông thuận lợi": hanhThongThuanLoiImg,
      "May Mắn Đủ Đầy": mayManDuDayImg,
      "May mắn đủ đầy": mayManDuDayImg,
      "Phú Quý Cát Tường": phuQuyCatTuongImg,
      "Phú quý cát tường": phuQuyCatTuongImg,
      "Phúc Lộc Song Toàn": phucLocSongToanImg,
      "Phúc lộc song toàn": phucLocSongToanImg,
      "Công Danh Thuận Lợi": congDanhThuanLoiImg,
      "Công danh thuận lợi": congDanhThuanLoiImg,
      "Đại Cát Đại Lợi": daiCatDaiLoiImg,
      "Đại cát đại lợi": daiCatDaiLoiImg,
    }),
    [],
  );

  const [phase, setPhase] = useState<"selection" | "reveal">("selection");
  const [revealedGifts, setRevealedGifts] = useState<RevealCard[]>([]);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const hasShownCongratsRef = useRef(false);
  /** Chỉ true khi chuyển sang reveal do vừa claim thành công trên trang này (không phải do vào trang đã nhận rồi). */
  const revealFromClaimSuccessRef = useRef(false);

  // Redirect nếu không có quà
  useEffect(() => {
    if (!isGiftEnabled) {
      navigate("/", { replace: true });
    }
  }, [isGiftEnabled, navigate]);

  // Khởi tạo shuffle khi vào trang
  useEffect(() => {
    if (activeGifts.length > 0) {
      setShuffledGifts(shuffleGifts(activeGifts));
    }
  }, [activeGifts]);

  // Nếu đã claim trước đó, hiển thị luôn kết quả thật
  useEffect(() => {
    if (isClaimed && claimedGift) {
      const realCard: RevealCard = {
        id: claimedGift.giftId,
        name: claimedGift.name,
        type: claimedGift.type,
        image: claimedGift.image,
        items: claimedGift.items,
        isReal: true,
      };

      const source = shuffledGifts.length > 0 ? shuffledGifts : activeGifts;

      if (source.length > 0) {
        const ordered = source.map((gift) => {
          const giftId = gift._id || gift.id;
          if (giftId === claimedGift.giftId) {
            return realCard;
          }
          return {
            id: giftId || gift.name,
            name: gift.name,
            image: gift.image,
            type: gift.type,
            items: gift.items,
          };
        });
        setRevealedGifts(ordered);
      } else {
        setRevealedGifts([realCard]);
      }
      setPhase("reveal");
    }
  }, [isClaimed, claimedGift, activeGifts, shuffledGifts]);

  // Khi claim thành công
  useEffect(() => {
    if (isSuccess && claimResult) {
      const realCard: RevealCard = {
        id: claimResult.giftId,
        name: claimResult.name,
        type: claimResult.type,
        image: claimResult.image,
        items: claimResult.items,
        isReal: true,
      };

      setRevealedGifts((prev) => {
        if (prev.length > 0) {
          let replaced = false;
          const updated = prev.map((gift) => {
            if (gift.id === claimResult.giftId) {
              replaced = true;
              return realCard;
            }
            return gift;
          });
          return replaced ? updated : [...updated, realCard];
        }

        const source = shuffledGifts.length > 0 ? shuffledGifts : activeGifts;
        if (source.length > 0) {
          const ordered = source.map((gift) => {
            const giftId = gift._id || gift.id;
            if (giftId === claimResult.giftId) {
              return realCard;
            }
            return {
              id: giftId || gift.name,
              name: gift.name,
              image: gift.image,
              type: gift.type,
              items: gift.items,
            };
          });
          return ordered;
        }

        return [realCard];
      });

      setPhase("reveal");
      markAsClaimed(claimResult);
      revealFromClaimSuccessRef.current = true;
    }
  }, [isSuccess, claimResult, markAsClaimed, activeGifts, shuffledGifts]);

  const handleSelectGift = (giftId: string) => {
    if (!scheduleId || isPending || phase === "reveal") return;
    setPhase("reveal");

    const source = shuffledGifts.length > 0 ? shuffledGifts : activeGifts;
    const ordered = source.map((gift) => {
      const id = gift._id || gift.id;
      const card: RevealCard = {
        id: id || gift.name,
        name: gift.name,
        image: gift.image,
        type: gift.type,
        items: gift.items,
      };
      if (id === giftId) {
        card.description = "Kết quả thật sẽ ở vị trí này";
        card.isRealPending = true;
      }
      return card;
    });

    setRevealedGifts(ordered);
    claimGift({ scheduleId, giftId });
  };

  const handleBack = () => {
    if (!isPending) {
      navigate(-1);
    }
  };

  // Hiển thị modal chúc mừng chỉ khi vừa mở quà trên trang này (không mở khi vào trang từ icon "đã nhận")
  useEffect(() => {
    const hasRealGift = revealedGifts.some((g) => g.isReal);
    if (
      phase === "reveal" &&
      !isPending &&
      hasRealGift &&
      revealFromClaimSuccessRef.current &&
      !hasShownCongratsRef.current
    ) {
      hasShownCongratsRef.current = true;
      setShowCongratsModal(true);
    }
  }, [phase, isPending, revealedGifts]);

  if (!isGiftEnabled) {
    return null;
  }

  const realGift = revealedGifts.find((g) => g.isReal);

  return (
    <>
      <style>{GIFT_STYLES}</style>

      {/* Modal chúc mừng khi mở quà thành công — gọn, vừa màn hình */}
      {showCongratsModal && realGift && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowCongratsModal(false)}
        >
          <div
            className="relative w-full max-w-[360px] max-h-[90vh] overflow-y-auto rounded-xl bg-gradient-to-b from-amber-950/95 to-black/95 p-3 shadow-2xl border border-amber-500/30 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowCongratsModal(false)}
              className="absolute top-1.5 right-1.5 text-white/80 hover:text-white transition-colors p-0.5 rounded-full hover:bg-white/10"
              aria-label="Đóng"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <p className="text-center text-amber-200/90 text-[11px] font-medium mb-0.5 pr-5">
              Phần quà của bạn
            </p>
            <p className="text-center text-amber-300/80 text-[10px] mb-1.5">
              Phần quà đã được thêm trực tiếp vào bill
            </p>
            <div className="flex justify-center mb-1.5 scale-75 origin-center">
              <GiftCard card={realGift} mode="reveal" />
            </div>
            <div className="max-h-[72px] overflow-y-auto mb-2">
              <p className="text-center text-white/90 text-[11px] leading-snug">
                {CONGRATS_MESSAGE}
              </p>
            </div>
            <button
              onClick={() => {
                setShowCongratsModal(false);
                navigate(-1);
              }}
              className="w-full rounded-full bg-lightpink hover:bg-lightpink/80 text-white font-semibold py-2 text-sm transition"
            >
              Quay lại
            </button>
          </div>
        </div>
      )}

      <div className="h-full overflow-y-auto bg-black/70 backdrop-blur-md rounded-2xl p-6 text-white relative">
        {/* Nút quay lại */}
        {!isPending && (
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 flex items-center gap-2 text-white/90 hover:text-white transition-colors z-10"
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
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            <span>Quay lại</span>
          </button>
        )}

        {phase === "selection" ? (
          <div className="flex flex-col gap-6 pt-12 pb-6">
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-200">
                Chọn một bao lì xì bạn muốn mở
              </p>
            </div>

            {isLoadingGifts ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-12 h-12 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : shuffledGifts.length > 0 ? (
              <div className="grid grid-cols-5 gap-2 pb-2">
                {shuffledGifts.map((gift) => {
                  const giftId = gift._id || gift.id;
                  if (!giftId) return null;
                  return (
                    <GiftCard
                      key={giftId}
                      card={{
                        id: giftId,
                        name: gift.name,
                        image:
                          giftImageMap[gift.name] || gift.image || gift.image,
                        type: gift.type,
                        items: gift.items,
                      }}
                      mode="selection"
                      onSelect={() => handleSelectGift(giftId)}
                      disabled={!scheduleId || isPending}
                      bounce
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-200">
                Hiện chưa có quà khả dụng.
              </p>
            )}

            {!scheduleId && (
              <p className="text-center text-sm text-yellow-300">
                Không tìm thấy scheduleId, vui lòng thử lại sau.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-12 pb-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-200">
                Phần quà đã áp dụng trực tiếp vào bill hiện tại.
              </p>
              {isPending && (
                <div className="w-12 h-12 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            <div className="grid grid-cols-5 gap-2 pb-2">
              {revealedGifts.map((gift, index) => (
                <GiftCard
                  key={`${gift.id}-${index}`}
                  card={gift}
                  mode="reveal"
                />
              ))}
            </div>

            {!isPending && revealedGifts.some((gift) => gift.isReal) && (
              <button
                onClick={handleBack}
                className="mt-2 w-full rounded-full bg-white/20 px-6 py-3 font-semibold transition hover:bg-white/30"
              >
                Quay lại
              </button>
            )}

            {!isPending && !revealedGifts.some((gift) => gift.isReal) && (
              <p className="text-center text-sm text-gray-200">
                Đang chờ kết quả thật từ API...
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Gift;
