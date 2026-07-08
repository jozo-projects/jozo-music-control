import {
  clearStoredPinVerification,
  getStoredPinVerification,
  isValidRoomPin,
  setStoredPinVerification,
} from "@/utils/roomPin";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  const [isPinVerified, setIsPinVerified] = useState(() =>
    getStoredPinVerification(roomId || undefined),
  );

  useEffect(() => {
    setIsPinVerified(getStoredPinVerification(roomId || undefined));
  }, [roomId]);

  const verifyPin = useCallback(
    (code: string): boolean => {
      if (isValidRoomPin(code)) {
        setIsPinVerified(true);
        setStoredPinVerification(roomId || undefined);
        return true;
      }
      return false;
    },
    [roomId],
  );

  const resetPinVerification = useCallback(() => {
    setIsPinVerified(false);
    clearStoredPinVerification();
  }, []);

  const value = useMemo(
    () => ({ isPinVerified, verifyPin, resetPinVerification }),
    [isPinVerified, verifyPin, resetPinVerification],
  );

  return (
    <RoomPinContext.Provider value={value}>{children}</RoomPinContext.Provider>
  );
};
