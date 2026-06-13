import { toast } from "@/components/ToastContainer";
import { useRoomPin } from "@/contexts/RoomPinContext";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import io from "socket.io-client";

interface SocketContextType {
  socket: ReturnType<typeof io> | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const roomIdRef = useRef<string>("");
  const hasShownConnectToastRef = useRef(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";
  const { isPinVerified } = useRoomPin();

  const showConnectToastOnce = () => {
    if (hasShownConnectToastRef.current) return;
    hasShownConnectToastRef.current = true;
    toast.success("Kết nối máy chủ thành công");
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      hasShownConnectToastRef.current = false;
    }
  };

  useEffect(() => {
    if (!roomId || !isPinVerified) {
      disconnectSocket();
      return;
    }

    roomIdRef.current = roomId;

    if (!socketRef.current) {
      console.log(`[Socket] Creating new connection for room: ${roomId}`);

      socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
        query: { roomId },
        transports: ["websocket"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: Infinity,
      });

      socketRef.current.on("connect", () => {
        const currentSocket = socketRef.current;
        const currentRoomId = roomIdRef.current;
        if (currentSocket && currentRoomId) {
          console.log(
            `[Socket] Connected to server, joining room: ${currentRoomId}`,
          );
          setIsConnected(true);
          currentSocket.emit("join", currentRoomId);
          showConnectToastOnce();
        }
      });

      socketRef.current.on("disconnect", (reason: string) => {
        console.log(`[Socket] Disconnected: ${reason}`);
        setIsConnected(false);
      });

      socketRef.current.on("reconnect_attempt", (attemptNumber: number) => {
        console.log(`[Socket] Reconnect attempt ${attemptNumber}`);
      });

      socketRef.current.on("reconnect", (attemptNumber: number) => {
        const currentRoomId = roomIdRef.current;
        console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        if (socketRef.current && currentRoomId) {
          console.log(`[Socket] Rejoining room: ${currentRoomId}`);
          socketRef.current.emit("join", currentRoomId);
          showConnectToastOnce();
        }
      });

      socketRef.current.on("connect_error", (error: Error) => {
        console.error(`[Socket] Connection error:`, error);
        setIsConnected(false);
      });
    } else if (socketRef.current.connected) {
      console.log(`[Socket] Rejoining room: ${roomId}`);
      socketRef.current.emit("join", roomId);
    }

    return () => {
      disconnectSocket();
    };
  }, [roomId, isPinVerified]);

  const value = {
    socket: socketRef.current,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
