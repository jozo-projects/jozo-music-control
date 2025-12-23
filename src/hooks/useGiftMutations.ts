import http from "@/utils/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

export const useClaimGift = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const roomIndex = searchParams.get("roomId") || "";

  return useMutation<ScheduleGift, Error, { scheduleId: string }>({
    mutationFn: async ({ scheduleId }: { scheduleId: string }) => {
      const response = await http.post<ApiResponse<ScheduleGift>>(
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

