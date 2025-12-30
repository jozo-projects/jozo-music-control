import referralGiftGif from "@/assets/gif/referral_gift.gif";
import sucKhoeDoiDaoImg from "@/assets/images/gifts/Sức khoẻ dồi dào.png";
import vanSuNhuYImg from "@/assets/images/gifts/Vạn sự như ý.png";
import anKhangThinhVuongImg from "@/assets/images/gifts/An khang thịnh vượng.png";
import tanTaiTanLocImg from "@/assets/images/gifts/Tấn tài tấn lộc.png";
import { useGift } from "@/contexts/GiftContext";
import { useClaimGift } from "@/hooks/useGiftMutations";
import { useGiftListQuery } from "@/hooks/useGiftQuery";
import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";

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

const GiftCard = ({ card, mode, onSelect, disabled, bounce }: GiftCardProps) => {
  const container = (
    <div
      className={`relative w-[220px] flex flex-col gap-3 rounded-2xl border p-4 ${
        card.isReal
          ? "border-green-400/80 bg-green-400/10"
          : card.isRealPending
            ? "border-yellow-300/70 bg-yellow-300/5"
            : "border-white/10 bg-white/5"
      } ${mode === "selection" ? "hover:-translate-y-1 transition" : ""}`}
    >
      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl bg-black/10">
        <img
          src={card.image || referralGiftGif}
          alt={card.name}
          className={`w-full h-full object-cover rounded-xl shadow transition-transform ${
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
          <span className="pointer-events-none absolute inset-0 rounded-xl bg-black/15" />
        )}
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="text-lg font-semibold line-clamp-1">{card.name}</div>
        {card.description && (
          <p className="text-xs text-gray-300">{card.description}</p>
        )}
      </div>

      {card.isReal && card.type === "snacks_drinks" && card.items && (
        <div className="w-full mt-1 space-y-2">
          {card.items.map((item, idx) => (
            <div
              key={`${item.itemId}-${idx}`}
              className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2"
            >
              <div className="flex flex-col">
                <span className="font-medium">{item.name}</span>
                {item.category && (
                  <span className="text-xs text-gray-200">{item.category}</span>
                )}
              </div>
              <span className="font-semibold">x{item.quantity}</span>
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

const GiftModal = () => {
  const {
    isModalOpen,
    closeGiftModal,
    scheduleId,
    markAsClaimed,
    isClaimed,
    claimedGift
  } = useGift();
  const { mutate: claimGift, isPending, isSuccess, data: claimResult } =
    useClaimGift();

  const { data: giftList, isLoading: isLoadingGifts } = useGiftListQuery();
  const activeGifts = useMemo(
    () => (giftList || []).filter((gift) => gift.isActive !== false),
    [giftList]
  );
  const [shuffledGifts, setShuffledGifts] = useState<Gift[]>([]);

  // Shuffle helper (Fisher-Yates)
  const shuffleGifts = (gifts: Gift[]) => {
    const arr = [...gifts];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Map tên quà -> hình bao lì xì tương ứng
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
    }),
    []
  );

  const [phase, setPhase] = useState<"selection" | "reveal">("selection");
  const [revealedGifts, setRevealedGifts] = useState<RevealCard[]>([]);

  // Khi modal đóng, reset toàn bộ state
  useEffect(() => {
    if (!isModalOpen) {
      setPhase("selection");
      setRevealedGifts([]);
      setShuffledGifts([]);
    } else if (activeGifts.length > 0) {
      setShuffledGifts(shuffleGifts(activeGifts));
    }
  }, [isModalOpen, activeGifts]);

  // Nếu đã claim trước đó, mở modal là hiển thị luôn kết quả thật
  useEffect(() => {
    if (isModalOpen && isClaimed && claimedGift) {
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
            image: gift.image || referralGiftGif,
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
  }, [isModalOpen, isClaimed, claimedGift, activeGifts, shuffledGifts]);

  // Khi claim thành công, gắn kết quả thật vào cuối danh sách reveal
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
        // Nếu đã có danh sách 4 quà, thay thế quà được chọn bằng quà thật
        if (prev.length > 0) {
          let replaced = false;
          const updated = prev.map((gift) => {
            if (gift.id === claimResult.giftId) {
              replaced = true;
              return realCard;
            }
            return gift;
          });
          // Nếu không tìm thấy, thêm vào cuối
          return replaced ? updated : [...updated, realCard];
        }

        // Nếu chưa có danh sách, fallback hiển thị tất cả activeGifts
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
              image: gift.image || referralGiftGif,
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
        image: gift.image || referralGiftGif,
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

  const handleClose = () => {
    if (!isPending) {
      closeGiftModal();
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
      `}</style>
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        onClick={handleClose}
      >
        <div
          className="p-6 overflow-y-auto bg-black bg-opacity-70 backdrop-blur-md rounded-lg relative"
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

          {phase === "selection" ? (
            <div className="flex flex-col gap-6 py-6 text-white">
              <div className="text-center space-y-1">
                <p className="text-sm text-gray-200">
                  Chọn một bao lì xì bạn muốn mở
                </p>
              </div>

              {isLoadingGifts ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-12 h-12 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : shuffledGifts && shuffledGifts.length > 0 ? (
                <div className="flex gap-4 pb-2 overflow-x-auto">
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
                            giftImageMap[gift.name] ||
                            gift.image ||
                            referralGiftGif,
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
            <div className="flex flex-col gap-4 py-4 text-white">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-200">
                  Phần quà đã áp dụng trực tiếp vào bill hiện tại.
                </p>
                {isPending && (
                  <div className="w-12 h-12 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2">
                {revealedGifts.map((gift, index) => (
                  <GiftCard key={`${gift.id}-${index}`} card={gift} mode="reveal" />
                ))}
              </div>

              {!isPending && revealedGifts.some((gift) => gift.isReal) && (
                <button
                  onClick={handleClose}
                  className="mt-2 w-full rounded-full bg-white/20 px-6 py-3 font-semibold transition hover:bg-white/30"
                >
                  Đóng
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
      </div>
    </>,
    document.body
  );
};

export default GiftModal;

