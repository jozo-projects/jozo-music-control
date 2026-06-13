import { useRoomAccessEnabled } from "@/hooks/useRoomAccessEnabled";
import http from "@/utils/http";
import { useQuery } from "@tanstack/react-query";

type UseFnbMenuQueryOptions = {
  /** Poll interval (ms) — dùng ở trang đặt món để cập nhật tồn kho realtime */
  refetchInterval?: number | false;
};

export const useFnbMenuQuery = (options?: UseFnbMenuQueryOptions) => {
  const isRoomAccessEnabled = useRoomAccessEnabled();

  return useQuery({
    queryKey: ["fnbMenu"],
    queryFn: async () => {
      const response = await http.get<ApiResponse<FnbItem[]>>(
        "/fnb-menu-item/",
      );

      const items = response.data.result;

      const menu: FnbMenu = {
        items,
        categories: [],
      };

      return menu;
    },
    enabled: isRoomAccessEnabled,
    // Tồn kho thay đổi thường xuyên — không cache lâu
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: options?.refetchInterval,
  });
};
