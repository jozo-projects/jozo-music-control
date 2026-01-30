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
  const [isConnected, setIsConnected] = React.useState(false);
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";

  useEffect(() => {
    if (roomId && !socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
        query: { roomId },
        transports: ["websocket"],
        reconnection: true, // Bật auto-reconnect
        reconnectionDelay: 1000, // Đợi 1s trước khi reconnect
        reconnectionAttempts: 5, // Thử reconnect tối đa 5 lần
      });

      socketRef.current.on("connect", () => {
        const currentSocket = socketRef.current;
        if (currentSocket) {
          console.log(`[Socket] Connected to server`);
          setIsConnected(true);

          // Join room với roomId sau khi kết nối thành công
          if (roomId) {
            currentSocket.emit("join", roomId);
          }
        }
      });

      socketRef.current.on("disconnect", (reason: string) => {
        console.log(`[Socket] Disconnected: ${reason}`);
        setIsConnected(false);
        // ✅ Không gọi disconnect() ở đây - để socket tự động reconnect
      });

      socketRef.current.on("reconnect_attempt", (attemptNumber: number) => {
        console.log(`[Socket] Reconnect attempt ${attemptNumber}`);
      });

      socketRef.current.on("reconnect", (attemptNumber: number) => {
        console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        // Rejoin room sau khi reconnect
        if (socketRef.current && roomId) {
          socketRef.current.emit("join", roomId);
        }
      });

      socketRef.current.on("connect_error", (error: Error) => {
        console.error(`[Socket] Connection error:`, error);
        setIsConnected(false);
      });
    }

    return () => {
      const currentSocket = socketRef.current;
      if (currentSocket) {
        currentSocket.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [roomId]);

  const value = {
    socket: socketRef.current,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
