import { useRoomAccessEnabled } from "@/hooks/useRoomAccessEnabled";
import http from "@/utils/http";
import { useQuery } from "@tanstack/react-query";

/** Cache danh sách menu — không poll liên tục vì chủ yếu dùng để hiển thị list */
const MENU_STALE_TIME_MS = 5 * 60_000;

export const useFnbMenuQuery = () => {
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
    staleTime: MENU_STALE_TIME_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
