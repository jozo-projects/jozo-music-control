import { useRoomAccessEnabled } from "@/hooks/useRoomAccessEnabled";
import { useQuery } from "@tanstack/react-query";
import http from "@/utils/http";
import { useSearchParams } from "react-router-dom";

interface UseSongNameOptions {
  enabled?: boolean;
}

export const useSongName = (query: string, options?: UseSongNameOptions) => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");
  const karaoke = searchParams.get("karaoke") === "true";
  const isRoomAccessEnabled = useRoomAccessEnabled();

  return useQuery({
    queryKey: ["songName", query.trim(), karaoke, roomId], // Thêm roomId và trim query để cache tốt hơn
    queryFn: async () => {
      const response = await http.get<ApiResponse<string[]>>(
        `/room-music/${roomId}/autocomplete`,
        {
          params: {
            keyword: query.trim(), // Trim ở đây để tránh gọi API với khoảng trắng
            karaoke,
          },
        }
      );
      return response.data;
    },
    select: (data) => data.result,
    enabled:
      isRoomAccessEnabled &&
      !!options?.enabled &&
      query.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // Tăng cache time lên 5 phút
    gcTime: 1000 * 60 * 10, // Giữ cache trong 10 phút
    refetchOnWindowFocus: false, // Không gọi lại khi focus window
    refetchOnMount: false, // Không gọi lại khi mount nếu đã có cache
  });
};
