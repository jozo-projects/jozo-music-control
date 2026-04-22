import http from "@/utils/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useRequestEndSessionMutation = (roomId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await http.post(`/room-music/${roomId}/request-end`, undefined, {
        skipErrorToast: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill", roomId] });
    },
  });
};
