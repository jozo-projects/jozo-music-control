import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { useBillQuery } from "@/hooks/useBillQuery";
import { useFnbMenuQuery } from "@/hooks/useFnbMenuQuery";
import { useRequestEndSessionMutation } from "@/hooks/useRequestEndSessionMutation";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "@/components/ToastContainer";
import { FNB_ORDER_ENABLED } from "@/utils/fnbOrder";
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
                className="fixed inset-0 z-[220] flex items-center justify-center bg-black/50 p-4"
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
                  className="liquid-glass w-full max-w-md rounded-3xl p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2
                    id="end-session-confirm-title"
                    className="mb-3 text-lg font-bold text-white"
                  >
                    Xác nhận kết thúc phiên
                  </h2>
                  <p className="mb-2 text-sm leading-relaxed text-white/70">
                    Bạn đang yêu cầu kết thúc phiên sử dụng tại thời điểm:
                  </p>
                  <p className="mb-4 text-center text-2xl font-bold tabular-nums text-white">
                    {formatNowTimeVi(confirmClock)}
                  </p>
                  <p className="mb-6 text-xs text-white/45">
                    Hệ thống đã in bill và quý khách vui lòng thanh toán tại
                    quầy.
                  </p>
                  <button
                    type="button"
                    disabled={isEndingSession}
                    onClick={submitRequestEndSession}
                    className="flex w-full items-center justify-center rounded-2xl border border-primary/40 bg-primary/80 px-4 py-3 text-sm font-medium text-primary-foreground shadow-brand-soft transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isEndingSession ? "Đang gửi…" : "Xác nhận kết thúc"}
                  </button>
                  <button
                    type="button"
                    disabled={isEndingSession}
                    onClick={() => setIsEndConfirmOpen(false)}
                    className="liquid-glass-btn mt-3 flex w-full items-center justify-center rounded-2xl py-2.5 text-white/85 disabled:opacity-50"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {isEndSuccessOpen && (
              <div
                className="fixed inset-0 z-[220] flex items-center justify-center bg-black/50 p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="end-session-success-title"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setIsEndSuccessOpen(false);
                }}
              >
                <div
                  className="liquid-glass w-full max-w-md rounded-3xl p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2
                    id="end-session-success-title"
                    className="mb-4 text-center text-lg font-bold text-white"
                  >
                    Đã xác nhận kết thúc
                  </h2>
                  <div className="space-y-3 text-center text-sm leading-relaxed text-white/70">
                    <p>Quý khách vui lòng thanh toán tại quầy lễ tân.</p>
                    <p>Cảm ơn quý khách đã sử dụng dịch vụ tại Jozo.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEndSuccessOpen(false)}
                    className="mt-6 flex w-full items-center justify-center rounded-2xl border border-primary/40 bg-primary/80 px-4 py-3 text-sm font-medium text-primary-foreground shadow-brand-soft transition-colors hover:bg-primary"
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
        <div className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 animate-pulse">
          <div className="mb-3 h-4 w-28 rounded bg-white/10" />
          <div className="h-6 w-36 rounded bg-white/15" />
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        {endSessionModals}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-400/35 bg-red-500/15 p-4 text-sm text-red-100">
          <span>Không tải được thông tin bill</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="liquid-glass-btn shrink-0 rounded-xl px-3 py-1.5 text-white"
          >
            Thử lại
          </button>
        </div>
      </>
    );
  }

  if (!bill) {
    return (
      <>
        {endSessionModals}
        <div className="space-y-4 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
          <p className="text-center text-sm leading-relaxed text-white/55">
            Hiện không có phiên đang sử dụng cho phòng này (hoặc chưa có bill).
          </p>
          <div className="space-y-2 rounded-xl bg-white/[0.05] p-4 ring-1 ring-white/10">
            <p className="text-center text-xs text-white/45">
              Thời gian đã sử dụng
            </p>
            <p className="text-center text-xl font-semibold text-white/35">—</p>
          </div>
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-2xl border border-white/10 py-3 px-4 text-sm font-semibold text-white/35"
          >
            Kết thúc phiên sử dụng
          </button>
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
      <div className="space-y-4 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-white/55">Thời gian đã sử dụng</p>
            <p className="mt-1 text-2xl font-bold text-white">{elapsedText}</p>
            {formattedStart && (
              <p className="mt-1 text-xs text-white/45">
                Bắt đầu: {formattedStart}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (cooldownMs > 0) return;
              refetch();
              setCooldownMs(30000);
            }}
            disabled={cooldownMs > 0}
            className="liquid-glass-btn shrink-0 rounded-xl px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cooldownMs > 0
              ? `Làm mới (${Math.ceil(cooldownMs / 1000)}s)`
              : "Làm mới"}
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white/80">
              Đồ ăn & Thức uống
            </p>
            {bill.fnbOrder?.completedAt && (
              <span className="text-xs text-white/45">
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
                    className="flex items-center justify-between rounded-xl bg-white/[0.06] px-3 py-2 ring-1 ring-white/10"
                  >
                    <span className="text-sm text-white">
                      {getItemName(itemId)}
                    </span>
                    <span className="text-sm font-bold text-white">
                      x{quantity}
                    </span>
                  </div>
                ),
              )}

              {Object.entries(bill.fnbOrder?.snacks || {}).map(
                ([itemId, quantity]) => (
                  <div
                    key={`snack-${itemId}`}
                    className="flex items-center justify-between rounded-xl bg-white/[0.06] px-3 py-2 ring-1 ring-white/10"
                  >
                    <span className="text-sm text-white">
                      {getItemName(itemId)}
                    </span>
                    <span className="text-sm font-bold text-white">
                      x{quantity}
                    </span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-white/55">
                Chưa có đơn FnB nào được ghi nhận.
              </p>
              {FNB_ORDER_ENABLED && (
                <button
                  type="button"
                  onClick={() => {
                    onClose?.();
                    navigate(`/fnb?roomId=${roomId}`);
                  }}
                  className="flex w-full items-center justify-center rounded-2xl border border-primary/40 bg-primary/80 px-4 py-3 text-sm font-medium text-primary-foreground shadow-brand-soft transition-colors hover:bg-primary"
                >
                  Đặt đồ ăn & thức uống
                </button>
              )}
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
          className="w-full rounded-2xl border border-primary/35 bg-primary/20 py-3 px-4 text-sm font-semibold text-white transition hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-primary/20"
        >
          {endButtonLabel}
        </button>
      </div>
    </>
  );
};

export default BillSummary;
