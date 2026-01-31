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
  const roomIdRef = useRef<string>(""); // Lưu roomId để tránh effect re-run
  const [isConnected, setIsConnected] = React.useState(false);
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";

  // Effect để khởi tạo socket - CHỈ chạy 1 lần khi mount
  useEffect(() => {
    if (!roomId) return;

    // Lưu roomId hiện tại
    roomIdRef.current = roomId;

    // Chỉ tạo socket nếu chưa có
    if (!socketRef.current) {
      console.log(`[Socket] Creating new connection for room: ${roomId}`);
      
      socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
        query: { roomId },
        transports: ["websocket"],
        reconnection: true, // Bật auto-reconnect
        reconnectionDelay: 1000, // Đợi 1s trước khi reconnect
        reconnectionAttempts: 5, // Thử reconnect tối đa 5 lần
      });

      socketRef.current.on("connect", () => {
        const currentSocket = socketRef.current;
        const currentRoomId = roomIdRef.current;
        if (currentSocket && currentRoomId) {
          console.log(`[Socket] Connected to server, joining room: ${currentRoomId}`);
          setIsConnected(true);
          // Join room với roomId hiện tại
          currentSocket.emit("join", currentRoomId);
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
        const currentRoomId = roomIdRef.current;
        console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        // Rejoin room sau khi reconnect
        if (socketRef.current && currentRoomId) {
          console.log(`[Socket] Rejoining room: ${currentRoomId}`);
          socketRef.current.emit("join", currentRoomId);
        }
      });

      socketRef.current.on("connect_error", (error: Error) => {
        console.error(`[Socket] Connection error:`, error);
        setIsConnected(false);
      });
    }

    // ✅ KHÔNG cleanup khi effect re-run - chỉ cleanup khi component unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency - chỉ chạy 1 lần

  // Effect riêng để update roomId khi URL thay đổi
  useEffect(() => {
    if (roomId && roomId !== roomIdRef.current) {
      console.log(`[Socket] Room ID changed: ${roomIdRef.current} -> ${roomId}`);
      roomIdRef.current = roomId;
      
      // Nếu đã connected, rejoin room mới
      if (socketRef.current?.connected) {
        console.log(`[Socket] Rejoining new room: ${roomId}`);
        socketRef.current.emit("join", roomId);
      }
    }
  }, [roomId]);

  // Cleanup chỉ khi component unmount
  useEffect(() => {
    return () => {
      console.log(`[Socket] Component unmounting, disconnecting...`);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, []);

  const value = {
    socket: socketRef.current,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
