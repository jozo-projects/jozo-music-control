import { useSearchParams } from "react-router-dom";

/** Cho phép gọi API phòng khi đã chọn phòng (không yêu cầu xác thực PIN). */
export const useRoomAccessEnabled = (): boolean => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";

  return !!roomId;
};
