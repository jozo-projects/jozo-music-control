import React from "react";
import ReactDOM from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToTop: () => void;
  onAddToEnd: () => void;
  songTitle: string;
  /** Nút đang xử lý thêm queue — khóa cả hai nút để tránh spam */
  addQueuePending?: "end" | "top" | null;
}

function AddQueueSpinner() {
  return (
    <svg
      className="size-8 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden={true}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

const actionBtnClass =
  "flex w-full flex-col items-center justify-center gap-y-2.5 rounded-2xl border border-primary/40 bg-primary/80 px-3 py-4 text-sm font-medium leading-none text-primary-foreground shadow-brand-soft transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary/80";

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onAddToTop,
  onAddToEnd,
  songTitle,
  addQueuePending = null,
}) => {
  if (!isOpen) return null;

  const isBusy = addQueuePending !== null;

  if (typeof document === "undefined") return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
      <div className="liquid-glass w-full max-w-xl rounded-3xl p-8 shadow-[0_24px_64px_rgba(0,0,0,0.45)]">
        <h2 className="mb-2 text-xl font-bold text-white">Chọn hành động</h2>
        <p className="mb-8 text-base text-white/70">
          Bài hát: <strong className="font-semibold text-white">{songTitle}</strong>
        </p>
        <div className="flex items-stretch justify-center gap-3">
          <button
            type="button"
            disabled={isBusy}
            onClick={onAddToEnd}
            className={actionBtnClass}
          >
            {addQueuePending === "end" ? (
              <AddQueueSpinner />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
            )}
            <span className="whitespace-nowrap">
              {addQueuePending === "end" ? "Đang thêm…" : "Thêm vào cuối danh sách"}
            </span>
          </button>

          <button
            type="button"
            disabled={isBusy}
            onClick={onAddToTop}
            className={actionBtnClass}
          >
            {addQueuePending === "top" ? (
              <AddQueueSpinner />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
            )}
            <span className="whitespace-nowrap">
              {addQueuePending === "top" ? "Đang thêm…" : "Thêm vào đầu danh sách"}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="liquid-glass-btn mt-5 flex w-full items-center justify-center gap-x-2 rounded-2xl py-3.5 text-base text-white/85"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
          Hủy
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
