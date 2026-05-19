import { useRoomIdGuard } from "@/hooks/useRoomIdGuard";
import routes from "@/routes/routes";
import React from "react";
import { useRoutes } from "react-router-dom";

const RoutesWrapper: React.FC = () => {
  useRoomIdGuard();
  const newRoutes = useRoutes(routes);

  return <>{newRoutes}</>;
};

export default RoutesWrapper;
