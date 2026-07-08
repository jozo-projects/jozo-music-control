import { useRoomPin } from "@/contexts/RoomPinContext";
import { ROOM_PIN_ENABLED } from "@/utils/roomPin";
import { useSearchParams } from "react-router-dom";

/** Cho phép gọi API phòng khi đã chọn phòng và xác thực PIN (nếu bật). */
export const useRoomAccessEnabled = (): boolean => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";
  const { isPinVerified } = useRoomPin();

  if (!roomId) return false;
  if (ROOM_PIN_ENABLED && !isPinVerified) return false;
  return true;
};
