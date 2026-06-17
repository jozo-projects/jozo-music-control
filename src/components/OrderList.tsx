import React from "react";
import { useFnbMenuQuery } from "@/hooks/useFnbMenuQuery";

interface OrderListProps {
  orders: FnbOrder[];
  isLoading?: boolean;
}

const isSnackCategory = (id: string) => id === "snack" || id === "snacks";
const isDrinkCategory = (id: string) => id === "drink" || id === "drinks";

const getOrderLines = (order: FnbOrder): FnbOrderLine[] => {
  if (order.order?.lines?.length) {
    return order.order.lines;
  }

  const lines: FnbOrderLine[] = [];
  Object.entries(order.order?.drinks || {}).forEach(([itemId, quantity]) => {
    lines.push({
      lineId: itemId,
      itemId,
      category: "drink",
      quantity,
    });
  });
  Object.entries(order.order?.snacks || {}).forEach(([itemId, quantity]) => {
    lines.push({
      lineId: itemId,
      itemId,
      category: "snack",
      quantity,
    });
  });
  return lines;
};

const mergeOrderLines = (lines: FnbOrderLine[]): FnbOrderLine[] => {
  const merged = new Map<string, FnbOrderLine>();

  for (const line of lines) {
    const existing = merged.get(line.itemId);
    if (existing) {
      existing.quantity += line.quantity;
    } else {
      merged.set(line.itemId, { ...line });
    }
  }

  return Array.from(merged.values());
};

const OrderList: React.FC<OrderListProps> = ({ orders, isLoading }) => {
  const { data: fnbMenu } = useFnbMenuQuery();

  // Helper function to parse variants (handle both array and JSON string)
  const parseVariants = (
    variants: FnbVariant[] | string | undefined
  ): FnbVariant[] => {
    if (!variants) return [];
    if (Array.isArray(variants)) return variants;
    if (typeof variants === "string") {
      try {
        return JSON.parse(variants);
      } catch (error) {
        console.error("Error parsing variants:", error);
        return [];
      }
    }
    return [];
  };

  const getItemName = (itemId: string): string => {
    if (!fnbMenu?.items) return "Unknown Item";

    // Tìm item chính
    const mainItem = fnbMenu.items.find((item) => item._id === itemId);
    if (mainItem) return mainItem.name;

    // Tìm trong variants
    for (const item of fnbMenu.items) {
      if (item.variants) {
        const variants: FnbVariant[] = parseVariants(item.variants);
        const variant = variants.find((v) => v._id === itemId);
        if (variant) return `${item.name} - ${variant.name}`;
      }
    }

    return "Unknown Item";
  };

  const STATUS_STYLES = {
    pending: {
      color: "bg-yellow-100 text-yellow-800",
      text: "Chờ xử lý",
    },
    processing: {
      color: "bg-blue-100 text-blue-800",
      text: "Đang xử lý",
    },
    completed: {
      color: "bg-green-100 text-green-800",
      text: "Hoàn thành",
    },
    cancelled: {
      color: "bg-red-100 text-red-800",
      text: "Đã hủy",
    },
  } as const;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          Chưa có đơn hàng nào
        </h3>
        <p className="text-gray-400">
          Hãy đặt hàng để xem danh sách đơn hàng ở đây
        </p>
      </div>
    );
  }

  const renderLineGroup = (
    title: string,
    lines: FnbOrderLine[],
  ) => {
    if (lines.length === 0) return null;

    return (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          {title}
        </h4>
        <div className="space-y-2">
          {lines.map((line) => (
            <div
              key={line.itemId}
              className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
            >
              <span className="text-gray-800 font-medium">
                {getItemName(line.itemId)}
              </span>
              <span className="text-brand-600 font-bold">x{line.quantity}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const lines = mergeOrderLines(getOrderLines(order));
        const drinkLines = lines.filter((line) =>
          isDrinkCategory(line.category),
        );
        const snackLines = lines.filter((line) =>
          isSnackCategory(line.category),
        );
        const otherLines = lines.filter(
          (line) =>
            !isDrinkCategory(line.category) && !isSnackCategory(line.category),
        );

        return (
          <div
            key={order.id || order.roomScheduleId || order.createdAt}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">
                  {order.createdAt ? formatDate(order.createdAt) : "N/A"}
                </p>
              </div>
              {order.status && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    STATUS_STYLES[order.status as keyof typeof STATUS_STYLES]
                      ?.color || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {STATUS_STYLES[order.status as keyof typeof STATUS_STYLES]
                    ?.text || order.status}
                </span>
              )}
            </div>

            {/* Order Items */}
            <div className="space-y-3">
              {renderLineGroup("Drinks", drinkLines)}
              {renderLineGroup("Snacks", snackLines)}
              {otherLines.length > 0 &&
                renderLineGroup("Khác", otherLines)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderList;
