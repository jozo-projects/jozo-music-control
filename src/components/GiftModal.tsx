import referralGiftGif from "@/assets/gif/referral_gift.gif";
import { useGift } from "@/contexts/GiftContext";
import { useClaimGift } from "@/hooks/useGiftMutations";
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

  const giftOptions = useMemo<RevealCard[]>(
    () =>
      Array.from({ length: 4 }, (_, idx) => ({
        id: `slot-${idx + 1}`,
        name: "",
        description: "Chạm để mở",
      })),
    []
  );

  const fakeRewards = useMemo<RevealCard[]>(
    () => [
      {
        id: "fake-20k",
        name: "Voucher 20K",
        description: "Giải an ủi 20.000đ",
        isReal: false,
      },
      {
        id: "fake-50k",
        name: "Voucher 50K",
        description: "Giải an ủi 50.000đ",
        isReal: false,
      },
      {
        id: "fake-100k",
        name: "Voucher 100K",
        description: "Giải an ủi 100.000đ",
        isReal: false,
      },
    ],
    []
  );

  const [phase, setPhase] = useState<"selection" | "reveal">("selection");
  const [revealedGifts, setRevealedGifts] = useState<RevealCard[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Khi modal đóng, reset toàn bộ state
  useEffect(() => {
    if (!isModalOpen) {
      setPhase("selection");
      setRevealedGifts([]);
      setSelectedIndex(null);
    }
  }, [isModalOpen]);

  // Nếu đã claim trước đó, mở modal là hiển thị luôn kết quả thật
  useEffect(() => {
    if (isModalOpen && isClaimed && claimedGift) {
      const targetIndex = selectedIndex ?? 0;
      const realCard: RevealCard = {
        id: claimedGift.giftId,
        name: claimedGift.name,
        type: claimedGift.type,
        image: claimedGift.image,
        items: claimedGift.items,
        isReal: true,
      };

      let fakeIdx = 0;
      const ordered = Array.from({ length: giftOptions.length }, (_, idx) => {
        if (idx === targetIndex) return realCard;
        const fake = fakeRewards[fakeIdx % fakeRewards.length];
        fakeIdx += 1;
        return fake;
      });

      setSelectedIndex(targetIndex);
      setPhase("reveal");
      setRevealedGifts(ordered);
    }
  }, [isModalOpen, isClaimed, claimedGift, fakeRewards, selectedIndex, giftOptions.length]);

  // Khi claim thành công, gắn kết quả thật vào cuối danh sách reveal
  useEffect(() => {
    if (isSuccess && claimResult) {
      setPhase("reveal");
      const realCard: RevealCard = {
        id: claimResult.giftId,
        name: claimResult.name,
        type: claimResult.type,
        image: claimResult.image,
        items: claimResult.items,
        isReal: true,
      };

      setRevealedGifts((prev) => {
        if (selectedIndex === null) {
          const withoutReal = prev.filter((gift) => !gift.isReal);
          return [...withoutReal, realCard];
        }
        return prev.map((gift, idx) => (idx === selectedIndex ? realCard : gift));
      });

      markAsClaimed(claimResult);
    }
  }, [isSuccess, claimResult, markAsClaimed, fakeRewards, selectedIndex]);

  const handleSelectGift = (index: number) => {
    if (!scheduleId || isPending || phase === "reveal") return;
    setSelectedIndex(index);
    setPhase("reveal");

    // Hiển thị 3 phần quà fake, giữ nguyên vị trí đã chọn cho quà thật
    setRevealedGifts(() => {
      let fakeIdx = 0;
      return Array.from({ length: giftOptions.length }, (_, idx) => {
        if (idx === index) {
          return {
            id: `pending-real-${idx}`,
            name: "Đang mở quà...",
            description: "Kết quả thật sẽ ở vị trí này",
            isRealPending: true,
          };
        }
        const fake = fakeRewards[fakeIdx % fakeRewards.length];
        fakeIdx += 1;
        return fake;
      });
    });
    claimGift({ scheduleId });
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
                  Hãy chọn bất kỳ một bao lì xì nhé
                </p>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {giftOptions.map((gift, index) => (
                  <button
                    key={gift.id}
                    onClick={() => handleSelectGift(index)}
                    disabled={!scheduleId || isPending}
                    className="relative min-w-[170px] flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-1 hover:border-pink-400/80 hover:shadow-lg disabled:opacity-60"
                  >
                    <img
                      src={referralGiftGif}
                      alt="Gift box"
                      className="w-28 h-28 object-contain"
                    />
                    <div className="text-lg font-semibold">{gift.name}</div>
                    <p className="text-xs text-gray-300">{gift.description}</p>
                  </button>
                ))}
              </div>
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
                  <div
                    key={`${gift.id}-${index}`}
                    className={`relative w-[220px] flex flex-col gap-3 rounded-2xl border p-4 ${
                      gift.isReal
                        ? "border-green-400/80 bg-green-400/10"
                        : gift.isRealPending
                          ? "border-yellow-300/70 bg-yellow-300/5"
                          : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl bg-black/10">
                      <img
                        src={
                          gift.isReal && gift.image ? gift.image : referralGiftGif
                        }
                        alt={gift.name}
                        className={`w-full h-full object-cover rounded-xl shadow transition-transform ${
                          gift.isReal ? "real-reveal" : gift.isRealPending ? "animate-pulse" : "fake-img"
                        }`}
                      />
                      {!gift.isReal && !gift.isRealPending && (
                        <span className="pointer-events-none absolute inset-0 rounded-xl bg-black/15" />
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="text-lg font-semibold">{gift.name}</div>
                      {gift.description && (
                        <p className="text-xs text-gray-300">{gift.description}</p>
                      )}
                    </div>

                    {gift.isReal && gift.type === "snacks_drinks" && gift.items && (
                      <div className="w-full mt-1 space-y-2">
                        {gift.items.map((item, idx) => (
                          <div
                            key={`${item.itemId}-${idx}`}
                            className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{item.name}</span>
                              {item.category && (
                                <span className="text-xs text-gray-200">
                                  {item.category}
                                </span>
                              )}
                            </div>
                            <span className="font-semibold">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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

