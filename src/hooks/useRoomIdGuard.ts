import { getBoundRoomId, setBoundRoomId } from "@/utils/boundRoomId";
import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

/**
 * Giữ roomId trên URL khớp với phòng đã gán (sessionStorage).
 * Chặn Back (hoặc sửa URL) đưa roomId về phòng cũ sau khi staff đã chọn phòng mới.
 */
export const useRoomIdGuard = (): void => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const roomId = searchParams.get("roomId") || "";

  useEffect(() => {
    if (!roomId) return;

    const bound = getBoundRoomId();
    if (!bound) {
      setBoundRoomId(roomId);
      return;
    }

    if (roomId === bound) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("roomId", bound);
    const qs = nextParams.toString();
    navigate(
      `${location.pathname}${qs ? `?${qs}` : ""}${location.hash}`,
      { replace: true },
    );
  }, [
    roomId,
    location.pathname,
    location.hash,
    searchParams,
    navigate,
  ]);
};
