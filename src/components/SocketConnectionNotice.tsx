interface SocketConnectionNoticeProps {
  isConnected: boolean;
  isDisconnectedTooLong: boolean;
  reconnect: () => void;
}

export default function SocketConnectionNotice({
  isConnected,
  isDisconnectedTooLong,
  reconnect,
}: SocketConnectionNoticeProps) {
  if (isConnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 top-3 z-[140] mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-gray-950 px-4 py-3 text-sm text-amber-100 shadow-xl"
    >
      <span>
        {isDisconnectedTooLong
          ? "Chưa kết nối được máy chủ."
          : "Mất kết nối máy chủ — đang kết nối lại…"}
      </span>
      {isDisconnectedTooLong && (
        <button
          type="button"
          onClick={reconnect}
          className="rounded-lg bg-amber-300 px-4 py-2 font-semibold text-gray-950 hover:bg-amber-200"
        >
          Kết nối lại
        </button>
      )}
    </div>
  );
}
