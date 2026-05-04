import React from "react";

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
      className="size-6 animate-spin text-gray-900"
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full md:w-3/4 lg:w-1/2 xl:w-1/3 rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Chọn hành động</h2>
        <p className="mb-6 text-gray-700">
          Bài hát: <strong>{songTitle}</strong>
        </p>
        <div className="flex items-center justify-center space-x-4">
          <button
            type="button"
            disabled={isBusy}
            onClick={onAddToEnd}
            className="bg-primary text-primary-foreground w-full py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors flex flex-col items-center gap-y-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-primary"
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
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
            )}
            {addQueuePending === "end" ? "Đang thêm…" : "Thêm vào cuối danh sách"}
          </button>

          <button
            type="button"
            disabled={isBusy}
            onClick={onAddToTop}
            className="bg-primary text-primary-foreground py-2 w-full px-4 rounded-lg hover:bg-primary-hover transition-colors flex flex-col items-center gap-y-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-primary"
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
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
            )}
            {addQueuePending === "top" ? "Đang thêm…" : "Thêm vào đầu danh sách"}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 px-4 rounded-lg text-gray-900 hover:bg-primary/15 flex items-center gap-x-2 justify-center transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
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
    </div>
  );
};

export default Modal;
