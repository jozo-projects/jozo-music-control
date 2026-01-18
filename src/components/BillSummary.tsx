import React, { useEffect, useMemo, useState } from "react";
import { useBillQuery } from "@/hooks/useBillQuery";
import { useFnbMenuQuery } from "@/hooks/useFnbMenuQuery";
import { useNavigate, useSearchParams } from "react-router-dom";

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
  const [elapsedText, setElapsedText] = useState<string>("--");
  const [cooldownMs, setCooldownMs] = useState<number>(0);

  const startTime = bill?.actualStartTime || bill?.startTime;
  const actualEndTime = bill?.actualEndTime;

  const hasFnbOrder =
    !!bill?.fnbOrder &&
    (Object.keys(bill.fnbOrder.drinks || {}).length > 0 ||
      Object.keys(bill.fnbOrder.snacks || {}).length > 0);

  const parseVariants = (
    variants: FnbVariant[] | string | undefined
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
      return "Dưới 1 phút";
    }

    const totalMinutes = Math.floor((endMs - startMs) / 1000 / 60);
    if (totalMinutes <= 0) return "Dưới 1 phút";

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
      <div className="p-4 border-b border-gray-700">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-pulse">
          <div className="h-4 w-28 bg-white/10 rounded mb-3" />
          <div className="h-6 w-36 bg-white/20 rounded" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
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
    );
  }

  if (!bill) return null;

  return (
    <div className="p-4 border-b border-gray-700">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Thời gian đã sử dụng</p>
            <p className="text-2xl font-bold text-white mt-1">{elapsedText}</p>
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
                  }
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
                )
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
                )
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
      </div>
    </div>
  );
};

export default BillSummary;
