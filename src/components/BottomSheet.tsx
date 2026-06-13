import React, { useEffect, useRef } from "react";

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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black bg-opacity-0 z-50 transition-all duration-300 ease-out backdrop"
        onClick={handleBackdropClick}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 overflow-hidden transform translate-y-full transition-all duration-300 ease-out bottom-sheet"
        style={{ maxHeight }}
        onClick={handleSheetClick}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        {title && (
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">{title}</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
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
        <div
          className="overflow-y-auto"
          style={{ maxHeight: `calc(${maxHeight} - 80px)` }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default BottomSheet;
