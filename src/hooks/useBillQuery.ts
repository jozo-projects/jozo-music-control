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

  return useQuery<IBill | null>({
    queryKey: ["bill", roomId],
    queryFn: async () => {
      const response = await http.get<ApiResponse<IBill | null>>(
        `/room-music/${roomId}/bill`,
        {
          validateStatus: (status) =>
            (status >= 200 && status < 300) || status === 404,
          skipErrorToast: true,
        }
      );
      if (response.status === 404) return null;
      return response.data.result ?? null;
    },
    enabled: !!roomId && isEnabled,
    refetchInterval: 60000, // Cập nhật mỗi phút để đồng bộ thời gian sử dụng và đơn FnB
  });
};
