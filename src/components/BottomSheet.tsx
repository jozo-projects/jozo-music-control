import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxHeight?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  maxHeight = "85vh",
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when sheet is open
      document.body.style.overflow = "hidden";

      // Add animation classes
      setTimeout(() => {
        if (sheetRef.current) {
          sheetRef.current.classList.add("bottom-sheet-open");
        }
        if (backdropRef.current) {
          backdropRef.current.classList.add("backdrop-open");
        }
      }, 10);
    } else {
      document.body.style.overflow = "";

      // Remove animation classes
      if (sheetRef.current) {
        sheetRef.current.classList.remove("bottom-sheet-open");
      }
      if (backdropRef.current) {
        backdropRef.current.classList.remove("backdrop-open");
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  const handleSheetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen || typeof document === "undefined") return null;

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="backdrop fixed inset-0 z-[140] bg-black/55 transition-all duration-300 ease-out"
        onClick={handleBackdropClick}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="bottom-sheet fixed bottom-0 left-0 right-0 z-[140] flex flex-col overflow-hidden rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl transition-all duration-300 ease-out"
        style={{ maxHeight }}
        onClick={handleSheetClick}
      >
        {/* Handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-2">
          <div className="h-1 w-12 rounded-full bg-gray-300"></div>
        </div>

        {/* Header */}
        {title && (
          <div className="shrink-0 border-b border-gray-100 px-6 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-full p-1 transition-colors hover:bg-gray-100"
              >
                <svg
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
};

export default BottomSheet;
