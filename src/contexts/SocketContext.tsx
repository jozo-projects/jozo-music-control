import SocketConnectionNotice from "@/components/SocketConnectionNotice";
import { toast } from "@/components/ToastContainer";
import { getDeviceId } from "@/utils/deviceId";
import { attachSocketRecovery } from "@/utils/socketRecovery";
import { useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import io from "socket.io-client";
import { getActiveDeviceProof } from "@/utils/deviceAuthorization";

interface SocketContextType {
  socket: ReturnType<typeof io> | null;
  isConnected: boolean;
  isDisconnectedTooLong: boolean;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isDisconnectedTooLong: false,
  reconnect: () => {},
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId")?.trim() || "";
  const recoveryRef = useRef<ReturnType<typeof attachSocketRecovery> | null>(null);
  const [connection, setConnection] = useState<{
    roomId: string;
    socket: ReturnType<typeof io> | null;
    isConnected: boolean;
    isDisconnectedTooLong: boolean;
  }>({ roomId: "", socket: null, isConnected: false, isDisconnectedTooLong: false });

  const reconnect = useCallback(() => recoveryRef.current?.reconnect(), []);

  useEffect(() => {
    if (!roomId) return;

    const proof = getActiveDeviceProof();
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "";
    let trustedSocket = false;
    try {
      const url = new URL(socketUrl);
      trustedSocket = (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password && !url.search && !url.hash;
    } catch { /* Never send a proof to an invalid or unspecified socket URL. */ }
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      ...(proof && trustedSocket ? { auth: { deviceProof: proof } } : {}),
      query: { roomId, deviceId: getDeviceId(), clientType: "control" },
      transports: ["websocket"],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
      timeout: 10000,
    });
    let hasConnected = false;
    setConnection({ roomId, socket, isConnected: false, isDisconnectedTooLong: false });

    const recovery = attachSocketRecovery(socket, {
      onConnected: () => {
        setConnection({ roomId, socket, isConnected: true, isDisconnectedTooLong: false });
        if (!hasConnected) {
          hasConnected = true;
          toast.success("Kết nối máy chủ thành công");
        }
        // The backend joins the room from the handshake on every connection.
        // Read canonical state; never replay add-song or playback mutations.
        void queryClient.invalidateQueries({ queryKey: ["queue", roomId], exact: true });
      },
      onDisconnected: () => {
        setConnection((previous) =>
          previous.socket === socket && previous.isConnected
            ? { ...previous, isConnected: false }
            : previous,
        );
      },
      onLongDisconnect: () => {
        setConnection((previous) =>
          previous.socket === socket
            ? { ...previous, isDisconnectedTooLong: true }
            : previous,
        );
      },
    });
    recoveryRef.current = recovery;
    window.addEventListener("online", recovery.reconnect);
    socket.connect();

    return () => {
      window.removeEventListener("online", recovery.reconnect);
      recovery.dispose();
      if (recoveryRef.current === recovery) recoveryRef.current = null;
      socket.disconnect();
    };
  }, [roomId, queryClient]);

  const isCurrentRoom = Boolean(roomId) && connection.roomId === roomId;
  const value: SocketContextType = {
    socket: isCurrentRoom ? connection.socket : null,
    isConnected: isCurrentRoom && connection.isConnected,
    isDisconnectedTooLong: isCurrentRoom && connection.isDisconnectedTooLong,
    reconnect,
  };

  return (
    <SocketContext.Provider value={value}>
      {roomId && <SocketConnectionNotice {...value} />}
      {children}
    </SocketContext.Provider>
  );
};
