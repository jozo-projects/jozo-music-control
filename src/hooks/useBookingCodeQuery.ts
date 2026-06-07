import { useRoomAccessEnabled } from "@/hooks/useRoomAccessEnabled";
import http from "@/utils/http";
import { useQuery } from "@tanstack/react-query";

export const useBookingCodeQuery = (bookingCode: string) => {
  const isRoomAccessEnabled = useRoomAccessEnabled();
  return useQuery({
    queryKey: ["bookingCode", bookingCode],
    queryFn: async () => {
      const response = await http.get<
        ApiResponse<
          Array<{
            video_id: string;
            title: string;
            thumbnail: string;
            author: string;
            duration: number;
            position: "top" | "end";
          }>
        >
      >(`/bookings/${bookingCode}/videos`);
      return response.data;
    },
    enabled: isRoomAccessEnabled && !!bookingCode && bookingCode.length === 4,
  });
};
