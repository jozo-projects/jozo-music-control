import { useEffect, useState } from "react";

type ToastType = "default" | "success" | "warning" | "error";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  createdAt: number;
}

const toastQueue: Array<(message: string, type?: ToastType) => void> = [];

export const ToastContainer = () => {
  const [toast, setToast] = useState<Toast | null>(null);

  // Hàm để thêm toast mới
  const addToast = (message: string, type: ToastType = "default") => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { id, message, type, createdAt: Date.now() };

    // Thay thế toast hiện tại bằng toast mới
    setToast(newToast);

    // Tự động xóa toast sau 3 giây
    setTimeout(() => {
      setToast((currentToast) =>
        currentToast?.id === id ? null : currentToast
      );
    }, 3000);
  };

  // Đăng ký hàm này vào hàng đợi toàn cục
  useEffect(() => {
    toastQueue.push(addToast);
    return () => {
      // Cleanup nếu component bị unmount
      const index = toastQueue.indexOf(addToast);
      if (index !== -1) toastQueue.splice(index, 1);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed right-4 top-24 flex justify-end pointer-events-none z-[250]">
      <div
        key={toast.id}
        className="px-6 py-3 rounded-lg max-w-md text-center text-primary-foreground transition-opacity duration-300 animate-fade-in-out pointer-events-auto bg-primary/30 backdrop-blur-md border border-primary/25 shadow-brand-soft"
      >
        {toast.message}
      </div>
    </div>
  );
};

// Singleton hàm gọi toast
export const toast = {
  message: (msg: string) => {
    toastQueue.forEach((fn) => fn(msg, "default"));
  },
  success: (msg: string) => {
    toastQueue.forEach((fn) => fn(msg, "success"));
  },
  warning: (msg: string) => {
    toastQueue.forEach((fn) => fn(msg, "warning"));
  },
  error: (msg: string) => {
    toastQueue.forEach((fn) => fn(msg, "error"));
  },
};
