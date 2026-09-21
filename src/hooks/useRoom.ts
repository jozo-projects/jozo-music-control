import { useMutation } from "@tanstack/react-query";
import http from "@/utils/http";

export interface SupportRequest {
  requestId: string;
  roomId: string;
  status: "pending" | "acknowledged" | "resolved" | "not_supported" | "expired";
  createdAt: string;
  expiresAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: { userId: string; name: string; role: string };
  resolvedAt?: string;
  resolvedBy?: { userId: string; name: string; role: string };
  supportNote?: string;
}

interface SupportRequestResponse {
  result: SupportRequest;
}

export const useCreateSupportRequest = () => {
  return useMutation({
    mutationFn: async (roomId: string) => {
      const normalizedRoomId = String(roomId ?? "").trim();
      if (!normalizedRoomId) {
        throw new Error("Room ID is required");
      }
      const response = await http.post<SupportRequestResponse>(
        `/room-music/${normalizedRoomId}/support-requests`,
      );
      const candidate = response.data?.result ?? response.data;
      if (!candidate?.requestId || !candidate?.roomId) {
        throw new Error(
          "Support request response is missing requestId or roomId",
        );
      }
      return {
        ...candidate,
        requestId: String(candidate.requestId),
        roomId: String(candidate.roomId),
      };
    },
  });
};

const useRoom = () => {
  return useMutation({
    mutationFn: ({ roomId, message }: { roomId: string; message: string }) => {
      return http.post(`/room-music/${roomId}/send-notification`, { message });
    },
  });
};

export default useRoom;
