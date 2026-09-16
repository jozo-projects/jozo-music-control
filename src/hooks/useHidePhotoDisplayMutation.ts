import { useMutation } from "@tanstack/react-query";
import http from "@/utils/http";

export const useHidePhotoDisplayMutation = (roomId: string) =>
  useMutation({
    mutationFn: () => http.post(`/room-music/${roomId}/photo-display/hide`),
  });
