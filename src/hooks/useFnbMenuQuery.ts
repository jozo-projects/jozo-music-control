import { useRoomAccessEnabled } from "@/hooks/useRoomAccessEnabled";
import http from "@/utils/http";
import { useQuery } from "@tanstack/react-query";

export const useFnbMenuQuery = () => {
  const isRoomAccessEnabled = useRoomAccessEnabled();

  return useQuery({
    queryKey: ["fnbMenu"],
    queryFn: async () => {
      const response = await http.get<ApiResponse<FnbItem[]>>(
        "/fnb-menu-item/"
      );

      // Tạo cấu trúc FnbMenu từ dữ liệu trả về
      const items = response.data.result;

      // Cấu trúc FnbMenu cần phải trả về cả categories và items
      const menu: FnbMenu = {
        items,
        categories: [], // Categories sẽ được xử lý ở phía component
      };

      return menu;
    },
    enabled: isRoomAccessEnabled,
  });
};
