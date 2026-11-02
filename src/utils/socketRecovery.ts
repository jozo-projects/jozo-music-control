import type io from "socket.io-client";

export interface RecoveryCallbacks {
  onConnected: () => void;
  onDisconnected: () => void;
  onLongDisconnect: () => void;
}

// Transport retry/backoff is owned by Socket.IO. Only a server-forced namespace
// disconnect needs an explicit connect(), since Socket.IO marks it inactive.
export function attachSocketRecovery(
  socket: ReturnType<typeof io>,
  callbacks: RecoveryCallbacks,
) {
  let disposed = false;
  let down = false;
  let retryServerDisconnect = false;
  let outageTimer: ReturnType<typeof setTimeout> | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  const markDisconnected = () => {
    callbacks.onDisconnected();
    if (down) return;
    down = true;
    outageTimer = setTimeout(() => {
      if (!disposed && down) callbacks.onLongDisconnect();
    }, 10_000);
  };

  const scheduleServerRetry = () => {
    if (retryTimer || !retryServerDisconnect || socket.active) return;
    retryTimer = setTimeout(() => {
      retryTimer = undefined;
      if (!disposed && !socket.connected && !socket.active) socket.connect();
    }, 1000);
  };

  const onConnect = () => {
    down = false;
    retryServerDisconnect = false;
    clearTimeout(outageTimer);
    clearTimeout(retryTimer);
    retryTimer = undefined;
    callbacks.onConnected();
  };
  const onDisconnect = (reason: string) => {
    markDisconnected();
    retryServerDisconnect = reason === "io server disconnect";
    if (retryServerDisconnect) scheduleServerRetry();
  };
  const onConnectError = () => {
    markDisconnected();
    scheduleServerRetry();
  };

  socket.on("connect", onConnect);
  socket.on("disconnect", onDisconnect);
  socket.on("connect_error", onConnectError);
  markDisconnected();

  return {
    reconnect: () => {
      if (disposed || socket.connected) return;
      clearTimeout(retryTimer);
      retryTimer = undefined;
      socket.connect();
    },
    dispose: () => {
      disposed = true;
      clearTimeout(outageTimer);
      clearTimeout(retryTimer);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    },
  };
}
