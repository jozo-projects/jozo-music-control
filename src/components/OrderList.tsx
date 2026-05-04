import React from "react";
import { useFnbMenuQuery } from "@/hooks/useFnbMenuQuery";

interface OrderListProps {
  orders: FnbOrder[];
  isLoading?: boolean;
}

const OrderList: React.FC<OrderListProps> = ({ orders, isLoading }) => {
  const { data: fnbMenu } = useFnbMenuQuery();

  console.log("orders", orders);

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

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">
                {order.createdAt ? formatDate(order.createdAt) : "N/A"}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                STATUS_STYLES[order.status as keyof typeof STATUS_STYLES]
                  ?.color || "bg-gray-100 text-gray-800"
              }`}
            >
              {STATUS_STYLES[order.status as keyof typeof STATUS_STYLES]
                ?.text || order.status}
            </span>
          </div>

          {/* Order Items */}
          <div className="space-y-3">
            {/* Drinks */}
            {Object.keys(order?.order?.drinks || {}).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  Drinks
                </h4>
                <div className="space-y-2">
                  {Object.entries(order?.order?.drinks || {}).map(
                    ([itemId, quantity]) => (
                      <div
                        key={itemId}
                        className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                      >
                        <span className="text-gray-800 font-medium">
                          {getItemName(itemId)}
                        </span>
                        <span className="text-brand-600 font-bold">
                          x{quantity}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Snacks */}
            {Object.keys(order?.order?.snacks || {}).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  Snacks
                </h4>
                <div className="space-y-2">
                  {Object.entries(order?.order?.snacks || {}).map(
                    ([itemId, quantity]) => (
                      <div
                        key={itemId}
                        className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                      >
                        <span className="text-gray-800 font-medium">
                          {getItemName(itemId)}
                        </span>
                        <span className="text-brand-600 font-bold">
                          x{quantity}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderList;
