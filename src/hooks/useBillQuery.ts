import http from "@/utils/http";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

type UseBillQueryOptions = {
  enabled?: boolean;
};

export const useBillQuery = (options?: UseBillQueryOptions) => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";
  const isEnabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ["bill", roomId],
    queryFn: async () => {
      const response = await http.get<ApiResponse<IBill>>(
        `/room-music/${roomId}/bill`
      );
      return response.data.result;
    },
    enabled: !!roomId && isEnabled,
    refetchInterval: 60000, // Cập nhật mỗi phút để đồng bộ thời gian sử dụng và đơn FnB
  });
};
