import http from "@/utils/http";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

export const useRoomGiftQuery = () => {
  const [searchParams] = useSearchParams();
  const roomIndex = searchParams.get("roomId") || "";

  return useQuery({
    queryKey: ["room-gift", roomIndex],
    queryFn: async () => {
      const response = await http.get<ApiResponse<RoomGiftResponse>>(
        `/gifts/room/${roomIndex}`
      );
      return response.data.result;
    },
    enabled: !!roomIndex,
    refetchInterval: 300000, // Refetch mỗi 5 phút để check trạng thái mới nhất
  });
};

