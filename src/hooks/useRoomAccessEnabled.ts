import { useSearchParams } from "react-router-dom";

/** Cho phép gọi API phòng khi đã có roomId (PIN không chặn API). */
export const useRoomAccessEnabled = (): boolean => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";

  return Boolean(roomId);
};
