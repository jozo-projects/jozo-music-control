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
      console.log(`[Socket] Connecting to room: ${roomId}`);

      socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
        query: { roomId },
        transports: ["websocket"],
        forceNew: true, // Force new connection
      });

      socketRef.current.on("connect", () => {
        const currentSocket = socketRef.current;
        if (currentSocket) {
          console.log(`[Socket] Connected: ${currentSocket.id}`);
          setIsConnected(true);
          
          // Join room với roomId sau khi kết nối thành công
          if (roomId) {
            console.log(`[Socket] Joining room: ${roomId}`);
            currentSocket.emit("join", roomId);
          }
        }
      });

      socketRef.current.on("disconnect", () => {
        if (socketRef.current) {
          console.log(`[Socket] Disconnected: ${socketRef.current.id}`);
        }
        setIsConnected(false);
      });

      socketRef.current.on("connect_error", (error: Error) => {
        console.error(`[Socket] Connection error:`, error);
        setIsConnected(false);
      });
    }

    return () => {
      const currentSocket = socketRef.current;
      if (currentSocket) {
        console.log(`[Socket] Cleaning up connection: ${currentSocket.id}`);
        currentSocket.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [roomId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
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
