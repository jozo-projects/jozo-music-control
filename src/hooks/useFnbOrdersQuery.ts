import { useRoomAccessEnabled } from "@/hooks/useRoomAccessEnabled";
import http from "@/utils/http";
import { useQuery } from "@tanstack/react-query";

export const useFnbOrdersQuery = (roomId: string) => {
  const isRoomAccessEnabled = useRoomAccessEnabled();
  return useQuery({
    queryKey: ["fnb-orders", roomId],
    queryFn: async () => {
      // API mới trả về một object FnbOrder thay vì mảng
      const response = await http.get<ApiResponse<FnbOrder>>(
        `/client/fnb/orders/room/${roomId}`,
        {
          validateStatus: (status) =>
            (status >= 200 && status < 300) || status === 404,
          skipErrorToast: true,
        }
      );
      if (response.status === 404) return [];

      const order = response.data.result;

      // Convert object thành mảng để giữ compatibility với component hiện tại
      // Nếu không có order (null/undefined), trả về mảng rỗng
      if (!order) return [];
      return [order];
    },
    enabled: isRoomAccessEnabled,
    retry: false,
    retryOnMount: false,
    refetchOnReconnect: false,
  });
};
