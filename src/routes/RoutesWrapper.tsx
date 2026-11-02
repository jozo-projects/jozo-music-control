import RoomSelectModal from "@/components/RoomSelectModal";
import { useRoomIdGuard } from "@/hooks/useRoomIdGuard";
import routes from "@/routes/routes";
import React from "react";
import { useRoutes, useSearchParams } from "react-router-dom";

const RoutesWrapper: React.FC = () => {
  useRoomIdGuard();
  const [searchParams] = useSearchParams();
  const newRoutes = useRoutes(routes);
  const roomId = searchParams.get("roomId")?.trim();

  // Do not mount operational screens or their effects until a room is selected.
  if (!roomId) {
    return <RoomSelectModal isOpen onClose={() => {}} />;
  }

  return <>{newRoutes}</>;
};

export default RoutesWrapper;
