import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { useBillQuery } from "@/hooks/useBillQuery";
import { useFnbMenuQuery } from "@/hooks/useFnbMenuQuery";
import { useRequestEndSessionMutation } from "@/hooks/useRequestEndSessionMutation";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "@/components/ToastContainer";

const END_REQUEST_COOLDOWN_MS = 30_000;

const formatNowTimeVi = (d: Date) =>
  d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const getErrorMessageFromAxios = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message && typeof data.message === "string") {
      return data.message;
    }
  }
  return fallback;
};

type BillSummaryProps = {
  autoFetch?: boolean;
  onClose?: () => void;
};

const BillSummary: React.FC<BillSummaryProps> = ({
  autoFetch = true,
  onClose,
}) => {
  const {
    data: bill,
    isLoading,
    isError,
    refetch,
  } = useBillQuery({
    enabled: autoFetch,
  });
  const { data: fnbMenu } = useFnbMenuQuery();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";
  const navigate = useNavigate();
  const endSessionMutation = useRequestEndSessionMutation(roomId);
  const isEndingSession = endSessionMutation.isPending;
  const [elapsedText, setElapsedText] = useState<string>("--");
  const [cooldownMs, setCooldownMs] = useState<number>(0);
  const [endRequestCooldownMs, setEndRequestCooldownMs] = useState(0);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);
  const [isEndSuccessOpen, setIsEndSuccessOpen] = useState(false);
  const [confirmClock, setConfirmClock] = useState(() => new Date());

  const startTime = bill?.actualStartTime || bill?.startTime;
  const actualEndTime = bill?.actualEndTime;

  const hasFnbOrder =
    !!bill?.fnbOrder &&
    (Object.keys(bill.fnbOrder.drinks || {}).length > 0 ||
      Object.keys(bill.fnbOrder.snacks || {}).length > 0);

  const parseVariants = (
    variants: FnbVariant[] | string | undefined,
  ): FnbVariant[] => {
    if (!variants) return [];
    if (Array.isArray(variants)) return variants;
    if (typeof variants === "string") {
      try {
        return JSON.parse(variants);
      } catch {
        return [];
      }
    }
    return [];
  };

  const getItemName = (itemId: string): string => {
    if (!fnbMenu?.items) return itemId;

    const mainItem = fnbMenu.items.find((item) => item._id === itemId);
    if (mainItem) return mainItem.name;

    for (const item of fnbMenu.items) {
      if (item.variants) {
        const variants: FnbVariant[] = parseVariants(item.variants);
        const variant = variants.find((v) => v._id === itemId);
        if (variant) return `${item.name} - ${variant.name}`;
      }
    }

    return itemId;
  };

  const formatDuration = (start?: string, actualEnd?: string) => {
    if (!start) return "--";

    const startMs = new Date(start).getTime();
    const endMs = actualEnd ? new Date(actualEnd).getTime() : Date.now();

    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
      return "0 phút";
    }

    const totalMinutes = Math.floor((endMs - startMs) / 1000 / 60);
    if (totalMinutes <= 0) return "0 phút";

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours} giờ`);
    if (minutes > 0) parts.push(`${minutes} phút`);

    return parts.length > 0 ? parts.join(" ") : "Dưới 1 phút";
  };

  useEffect(() => {
    const updateElapsed = () =>
      setElapsedText(formatDuration(startTime, actualEndTime));
    updateElapsed();

    if (bill && !bill.actualEndTime) {
      const timer = setInterval(updateElapsed, 60000);
      return () => clearInterval(timer);
    }
  }, [bill, startTime, actualEndTime]);

  useEffect(() => {
    if (cooldownMs <= 0) return;
    const timer = setInterval(() => {
      setCooldownMs((prev) => Math.max(prev - 1000, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownMs]);

  useEffect(() => {
    if (endRequestCooldownMs <= 0) return;
    const timer = setInterval(() => {
      setEndRequestCooldownMs((prev) => Math.max(prev - 1000, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [endRequestCooldownMs]);

  useEffect(() => {
    if (!isEndConfirmOpen) return;
    setConfirmClock(new Date());
    const timer = setInterval(() => setConfirmClock(new Date()), 60_000);
    return () => clearInterval(timer);
  }, [isEndConfirmOpen]);

  const submitRequestEndSession = () => {
    if (!roomId || !bill || isEndingSession) return;
    endSessionMutation.mutate(undefined, {
      onSuccess: () => {
        setIsEndConfirmOpen(false);
        setIsEndSuccessOpen(true);
        setEndRequestCooldownMs(END_REQUEST_COOLDOWN_MS);
      },
      onError: (error) => {
        if (!axios.isAxiosError(error) || !error.response) {
          toast.error(
            getErrorMessageFromAxios(
              error,
              "Lỗi mạng hoặc server không phản hồi. Vui lòng thử lại.",
            ),
          );
          return;
        }
        const status = error.response.status;
        const msg = getErrorMessageFromAxios(
          error,
          "Đã xảy ra lỗi. Vui lòng thử lại.",
        );
        if (status === 429) {
          setEndRequestCooldownMs(END_REQUEST_COOLDOWN_MS);
        }
        toast.error(msg);
      },
    });
  };

  const endSessionModals =
    typeof document !== "undefined"
      ? ReactDOM.createPortal(
          <>
            {isEndConfirmOpen && (
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[150] p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="end-session-confirm-title"
                onClick={(e) => {
                  if (e.target === e.currentTarget && !isEndingSession) {
                    setIsEndConfirmOpen(false);
                  }
                }}
              >
                <div
                  className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2
                    id="end-session-confirm-title"
                    className="text-lg font-bold text-white mb-3"
                  >
                    Xác nhận kết thúc phiên
                  </h2>
                  <p className="text-gray-300 text-sm leading-relaxed mb-2">
                    Bạn đang yêu cầu kết thúc phiên sử dụng tại thời điểm:
                  </p>
                  <p className="text-2xl font-bold text-lightpink tabular-nums mb-6 text-center">
                    {formatNowTimeVi(confirmClock)}
                  </p>
                  <p className="text-xs text-gray-500 mb-6">
                    Hệ thống đã in bill và quý khách vui lòng thanh toán tại
                    quầy.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={isEndingSession}
                      onClick={() => setIsEndConfirmOpen(false)}
                      className="flex-1 py-3 px-4 rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 transition disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      disabled={isEndingSession}
                      onClick={submitRequestEndSession}
                      className="flex-1 py-3 px-4 rounded-xl font-semibold bg-red-500/80 text-white hover:bg-red-500 transition disabled:opacity-60"
                    >
                      {isEndingSession ? "Đang gửi…" : "Xác nhận kết thúc"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isEndSuccessOpen && (
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[160] p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="end-session-success-title"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setIsEndSuccessOpen(false);
                }}
              >
                <div
                  className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-emerald-500/30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2
                    id="end-session-success-title"
                    className="text-xl font-bold text-white mb-4 text-center"
                  >
                    Đã xác nhận kết thúc
                  </h2>
                  <div className="space-y-4 text-center text-gray-200 text-sm leading-relaxed">
                    <p>Quý khách vui lòng thanh toán tại quầy lễ tân.</p>
                    <p className="text-white/90">
                      Cảm ơn quý khách đã sử dụng dịch vụ tại Jozo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEndSuccessOpen(false)}
                    className="w-full mt-8 py-3 px-4 rounded-xl font-semibold bg-lightpink text-white hover:bg-lightpink/90 transition"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </>,
          document.body,
        )
      : null;

  const formattedStart = useMemo(() => {
    if (!startTime) return null;
    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) return null;
    return startDate.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [startTime]);

  if (isLoading) {
    return (
      <>
        {endSessionModals}
        <div className="p-4 border-b border-gray-700">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-pulse">
            <div className="h-4 w-28 bg-white/10 rounded mb-3" />
            <div className="h-6 w-36 bg-white/20 rounded" />
          </div>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        {endSessionModals}
        <div className="p-4 border-b border-gray-700">
          <div className="bg-red-500/10 border border-red-500/30 text-red-100 rounded-2xl p-4 flex items-center justify-between">
            <span>Không tải được thông tin bill</span>
            <button
              onClick={() => refetch()}
              className="px-3 py-1 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              Thử lại
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!bill) {
    return (
      <>
        {endSessionModals}
        <div className="p-4 border-b border-gray-700">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
            <p className="text-sm text-gray-400 text-center leading-relaxed">
              Hiện không có phiên đang sử dụng cho phòng này (hoặc chưa có
              bill).
            </p>
            <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-3">
              <p className="text-xs text-gray-500 text-center">
                Thời gian đã sử dụng
              </p>
              <p className="text-center text-xl font-semibold text-white/40">
                —
              </p>
            </div>
            <button
              type="button"
              disabled
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-white/5 text-white/35 border border-white/10 cursor-not-allowed"
            >
              Kết thúc phiên sử dụng
            </button>
          </div>
        </div>
      </>
    );
  }

  const endButtonDisabled = isEndingSession || endRequestCooldownMs > 0;

  const endButtonLabel = (() => {
    if (isEndingSession) return "Đang gửi…";
    if (endRequestCooldownMs > 0) {
      return `Kết thúc phiên sử dụng (${Math.ceil(endRequestCooldownMs / 1000)}s)`;
    }
    return "Kết thúc phiên sử dụng";
  })();

  return (
    <>
      {endSessionModals}
      <div className="p-4 border-b border-gray-700">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Thời gian đã sử dụng</p>
              <p className="text-2xl font-bold text-white mt-1">
                {elapsedText}
              </p>
              {formattedStart && (
                <p className="text-xs text-gray-400 mt-1">
                  Bắt đầu: {formattedStart}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                if (cooldownMs > 0) return;
                refetch();
                setCooldownMs(30000);
              }}
              disabled={cooldownMs > 0}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cooldownMs > 0
                ? `Làm mới (${Math.ceil(cooldownMs / 1000)}s)`
                : "Làm mới"}
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-300 font-semibold">
                Đồ ăn & Thức uống
              </p>
              {bill.fnbOrder?.completedAt && (
                <span className="text-xs text-gray-400">
                  Hoàn tất:{" "}
                  {new Date(bill.fnbOrder.completedAt).toLocaleTimeString(
                    "vi-VN",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </span>
              )}
            </div>

            {hasFnbOrder ? (
              <div className="space-y-2">
                {Object.entries(bill.fnbOrder?.drinks || {}).map(
                  ([itemId, quantity]) => (
                    <div
                      key={`drink-${itemId}`}
                      className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2"
                    >
                      <span className="text-sm text-white">
                        {getItemName(itemId)}
                      </span>
                      <span className="text-sm text-lightpink font-bold">
                        x{quantity}
                      </span>
                    </div>
                  ),
                )}

                {Object.entries(bill.fnbOrder?.snacks || {}).map(
                  ([itemId, quantity]) => (
                    <div
                      key={`snack-${itemId}`}
                      className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2"
                    >
                      <span className="text-sm text-white">
                        {getItemName(itemId)}
                      </span>
                      <span className="text-sm text-lightpink font-bold">
                        x{quantity}
                      </span>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-400">
                  Chưa có đơn FnB nào được ghi nhận.
                </p>
                <button
                  onClick={() => {
                    onClose?.();
                    navigate(`/fnb?roomId=${roomId}`);
                  }}
                  className="w-full px-4 py-3 bg-lightpink text-white font-semibold rounded-xl hover:bg-lightpink/90 transition"
                >
                  Đặt đồ ăn & thức uống
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (endButtonDisabled) return;
              setIsEndConfirmOpen(true);
            }}
            disabled={endButtonDisabled}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold border transition bg-red-500/15 border-red-400/40 text-red-100 hover:bg-red-500/25 disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-red-500/15"
          >
            {endButtonLabel}
          </button>
        </div>
      </div>
    </>
  );
};

export default BillSummary;
