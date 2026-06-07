import { isValidRoomPin } from "@/utils/roomPin";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";

interface RoomPinContextType {
  isPinVerified: boolean;
  verifyPin: (code: string) => boolean;
  resetPinVerification: () => void;
}

const RoomPinContext = createContext<RoomPinContextType | null>(null);

export const useRoomPin = (): RoomPinContextType => {
  const context = useContext(RoomPinContext);
  if (!context) {
    throw new Error("useRoomPin must be used within a RoomPinProvider");
  }
  return context;
};

interface RoomPinProviderProps {
  children: ReactNode;
}

export const RoomPinProvider: React.FC<RoomPinProviderProps> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";
  const [isPinVerified, setIsPinVerified] = useState(false);

  useEffect(() => {
    setIsPinVerified(false);
  }, [roomId]);

  const verifyPin = useCallback((code: string): boolean => {
    if (isValidRoomPin(code)) {
      setIsPinVerified(true);
      return true;
    }
    return false;
  }, []);

  const resetPinVerification = useCallback(() => {
    setIsPinVerified(false);
  }, []);

  return (
    <RoomPinContext.Provider
      value={{ isPinVerified, verifyPin, resetPinVerification }}
    >
      {children}
    </RoomPinContext.Provider>
  );
};
