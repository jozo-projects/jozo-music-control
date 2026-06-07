import { useRoomAccessEnabled } from "@/hooks/useRoomAccessEnabled";
import http from "@/utils/http";
import { useQuery } from "@tanstack/react-query";

export const useGiftListQuery = () => {
  const isRoomAccessEnabled = useRoomAccessEnabled();

  return useQuery({
    queryKey: ["gifts"],
    queryFn: async () => {
      const response = await http.get<ApiResponse<Gift[]>>("/gifts/public");
      return response.data.result;
    },
    enabled: isRoomAccessEnabled,
  });
};

