import { useRoomPin } from "@/contexts/RoomPinContext";
import { ROOM_PIN_ENABLED } from "@/utils/roomPin";
import React from "react";
import { useSearchParams } from "react-router-dom";
import RoomPinModal from "./RoomPinModal";

const RoomPinGate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";
  const { isPinVerified } = useRoomPin();

  if (!ROOM_PIN_ENABLED || !roomId || isPinVerified) return null;

  return <RoomPinModal roomId={roomId} />;
};

export default RoomPinGate;
