import { useRoomAccessEnabled } from "@/hooks/useRoomAccessEnabled";
import http from "@/utils/http";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

export const useQueueQuery = () => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");
  const isRoomAccessEnabled = useRoomAccessEnabled();

  return useQuery({
    queryKey: ["queue", roomId],
    queryFn: async () => {
      const response = await http.get<
        ApiResponse<{
          nowPlaying: Video;
          queue: Video[];
        }>
      >(`/room-music/${roomId}`);
      return response.data;
    },
    enabled: isRoomAccessEnabled,
  });
};
