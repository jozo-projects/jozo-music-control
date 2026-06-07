import { useRoomPin } from "@/contexts/RoomPinContext";
import { useSearchParams } from "react-router-dom";

/** Chỉ cho phép gọi API phòng khi đã chọn phòng và xác thực PIN. */
export const useRoomAccessEnabled = (): boolean => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";
  const { isPinVerified } = useRoomPin();

  return !!roomId && isPinVerified;
};
