import http from "@/utils/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

interface ClaimGiftResponse {
  gift: ScheduleGift; // Response từ backend sẽ là ScheduleGift
  scheduleId: string;
}

export const useClaimGift = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const roomIndex = searchParams.get("roomId") || "";

  return useMutation({
    mutationFn: async ({ scheduleId }: { scheduleId: string }) => {
      const response = await http.post<ApiResponse<ClaimGiftResponse>>(
        "/gifts/claim",
        { scheduleId }
      );
      return response.data.result;
    },
    onSuccess: () => {
      // Invalidate room gift query để refetch trạng thái mới nhất sau khi claim
      queryClient.invalidateQueries({
        queryKey: ["room-gift", roomIndex],
      });
    },
  });
};

