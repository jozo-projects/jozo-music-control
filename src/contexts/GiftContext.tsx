import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useSocket } from "./SocketContext";
import { useRoomGiftQuery } from "@/hooks/useRoomGiftQuery";

interface GiftContextType {
  scheduleId: string | null;
  isGiftEnabled: boolean;
  isClaimed: boolean;
  isModalOpen: boolean;
  claimedGift: ScheduleGift | null;
  openGiftModal: () => void;
  closeGiftModal: () => void;
  markAsClaimed: (gift?: ScheduleGift) => void;
  resetGift: () => void;
}

const GiftContext = createContext<GiftContextType>({
  scheduleId: null,
  isGiftEnabled: false,
  isClaimed: false,
  isModalOpen: false,
  claimedGift: null,
  openGiftModal: () => {},
  closeGiftModal: () => {},
  markAsClaimed: () => {},
  resetGift: () => {},
});

export const useGift = () => {
  const context = useContext(GiftContext);
  if (!context) {
    throw new Error("useGift must be used within a GiftProvider");
  }
  return context;
};

interface GiftProviderProps {
  children: ReactNode;
}

export const GiftProvider: React.FC<GiftProviderProps> = ({ children }) => {
  const { socket } = useSocket();
  const { data: roomGiftData } = useRoomGiftQuery();
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [isGiftEnabled, setIsGiftEnabled] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [claimedGift, setClaimedGift] = useState<ScheduleGift | null>(null);

  // Sync state từ API response
  useEffect(() => {
    if (roomGiftData) {
      // Cập nhật scheduleId từ API
      if (roomGiftData.scheduleId) {
        setScheduleId(roomGiftData.scheduleId);
      }

      // Cập nhật trạng thái gift enabled từ API
      setIsGiftEnabled(roomGiftData.giftEnabled);

      // Nếu có gift và status là 'claimed', đánh dấu là đã claim
      if (roomGiftData.gift && roomGiftData.gift.status === "claimed") {
        setIsClaimed(true);
        setIsGiftEnabled(true); // Vẫn hiển thị float button để xem quà đã mở
        setClaimedGift(roomGiftData.gift);
      } else if (roomGiftData.gift && roomGiftData.gift.status === "assigned") {
        // Nếu gift status là 'assigned', chưa claim
        setIsClaimed(false);
        setClaimedGift(null);
      }
    }
  }, [roomGiftData]);

  // Lắng nghe event gift_enabled từ socket
  useEffect(() => {
    if (!socket) return;

    const handleGiftEnabled = (data: { scheduleId: string }) => {
      setScheduleId(data.scheduleId);
      setIsGiftEnabled(true);
      setIsClaimed(false);
    };

    socket.on("gift_enabled", handleGiftEnabled);

    return () => {
      socket.off("gift_enabled", handleGiftEnabled);
    };
  }, [socket]);

  // Lắng nghe thay đổi trạng thái gift từ backend
  useEffect(() => {
    if (!socket) return;

    const handleGiftStatusChanged = (data: {
      roomId: string;
      scheduleId: string;
      giftEnabled: boolean;
    }) => {
      setScheduleId(data.scheduleId);
      setIsGiftEnabled(data.giftEnabled);

      if (data.giftEnabled) {
        // Khi bật quà mới, reset trạng thái để hiển thị nút mở quà
        setIsClaimed(false);
        setClaimedGift(null);
      } else {
        // Khi tắt quà, ẩn modal & trạng thái claim
        setIsClaimed(false);
        setIsModalOpen(false);
        setClaimedGift(null);
      }
    };

    socket.on("gift_status_changed", handleGiftStatusChanged);

    return () => {
      socket.off("gift_status_changed", handleGiftStatusChanged);
    };
  }, [socket]);

  const openGiftModal = useCallback(() => {
    if (isGiftEnabled) {
      setIsModalOpen(true);
    }
  }, [isGiftEnabled]);

  const closeGiftModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const markAsClaimed = useCallback((gift?: ScheduleGift) => {
    setIsClaimed(true);
    setIsGiftEnabled(true); // Vẫn giữ enabled để hiển thị float button
    if (gift) {
      setClaimedGift(gift);
    }
    // Không đóng modal, để user xem quà đã mở
  }, []);

  const resetGift = useCallback(() => {
    setScheduleId(null);
    setIsGiftEnabled(false);
    setIsClaimed(false);
    setIsModalOpen(false);
    setClaimedGift(null);
  }, []);

  const value = {
    scheduleId,
    isGiftEnabled,
    isClaimed,
    isModalOpen,
    claimedGift,
    openGiftModal,
    closeGiftModal,
    markAsClaimed,
    resetGift,
  };

  return <GiftContext.Provider value={value}>{children}</GiftContext.Provider>;
};
