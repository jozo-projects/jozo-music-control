import { getBoundRoomId, setBoundRoomId } from "@/utils/boundRoomId";
import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * - Lần đầu có roomId trên URL (load trang hoặc navigate): URL là nguồn đúng, ghi đè bound cũ.
 * - Nút Back/Forward: giữ roomId khớp phòng đã gán sau khi staff chọn phòng mới.
 */
export const useRoomIdGuard = (): void => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get("roomId") || "";
  const hasSyncedFromUrl = useRef(false);

  useEffect(() => {
    if (!roomId || hasSyncedFromUrl.current) return;

    hasSyncedFromUrl.current = true;
    setBoundRoomId(roomId);
  }, [roomId]);

  useEffect(() => {
    const enforceBoundRoom = () => {
      const params = new URLSearchParams(window.location.search);
      const currentRoomId = params.get("roomId") || "";
      if (!currentRoomId) return;

      const bound = getBoundRoomId();
      if (!bound || currentRoomId === bound) return;

      params.set("roomId", bound);
      const qs = params.toString();
      const path = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
      navigate(path, { replace: true });
    };

    window.addEventListener("popstate", enforceBoundRoom);
    return () => window.removeEventListener("popstate", enforceBoundRoom);
  }, [navigate]);
};
