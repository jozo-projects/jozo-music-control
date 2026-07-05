import { getBoundRoomId, setBoundRoomId } from "@/utils/boundRoomId";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const buildPathWithParams = (params: URLSearchParams): string => {
  const qs = params.toString();
  return `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
};

const enforceBoundRoomOnUrl = (
  searchParams: URLSearchParams,
  navigate: ReturnType<typeof useNavigate>,
): void => {
  const bound = getBoundRoomId();
  if (!bound) return;

  const params = new URLSearchParams(searchParams);
  const currentRoomId = params.get("roomId") || "";

  if (currentRoomId === bound) return;

  params.set("roomId", bound);
  navigate(buildPathWithParams(params), { replace: true });
};

/**
 * - Lần đầu có roomId trên URL: ghi bound (QR / load trang).
 * - URL thiếu roomId: gắn lại bound từ sessionStorage.
 * - URL roomId khác bound (Back/Forward): luôn ép về bound — không cho nhảy phòng cũ.
 */
export const useRoomIdGuard = (): void => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get("roomId") || "";

  useEffect(() => {
    const bound = getBoundRoomId();

    if (!roomId) {
      if (!bound) return;
      const params = new URLSearchParams(searchParams);
      params.set("roomId", bound);
      navigate(buildPathWithParams(params), { replace: true });
      return;
    }

    if (!bound) {
      setBoundRoomId(roomId);
      return;
    }

    if (roomId !== bound) {
      enforceBoundRoomOnUrl(searchParams, navigate);
    }
  }, [roomId, searchParams, navigate]);

  useEffect(() => {
    const onPopState = () => {
      enforceBoundRoomOnUrl(
        new URLSearchParams(window.location.search),
        navigate,
      );
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [navigate]);
};
