import { useEffect, useRef, useState } from "react";

type ToastType = "default" | "success" | "warning" | "error";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  createdAt: number;
}

const TOAST_VISIBLE_MS = 2800;
const TOAST_EXIT_MS = 340;

const toastQueue: Array<(message: string, type?: ToastType) => void> = [];

const typeClass: Record<ToastType, string> = {
  default: "",
  success: "toast-glass--success",
  warning: "toast-glass--warning",
  error: "toast-glass--error",
};

const ToastIcon = ({ type }: { type: ToastType }) => {
  if (type === "success") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/25 text-emerald-200">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path
            fillRule="evenodd"
            d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.42 0l-3.25-3.25a1 1 0 011.42-1.42l2.54 2.54 6.54-6.54a1 1 0 011.42 0z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }

  if (type === "error") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-400/25 text-red-200">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </span>
    );
  }

  if (type === "warning") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/25 text-amber-200">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path
            fillRule="evenodd"
            d="M8.26 3.66a2 2 0 013.48 0l6.1 11.14A2 2 0 0116.1 18H3.9a2 2 0 01-1.74-3.2L8.26 3.66zM10 7.75a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5A.75.75 0 0010 7.75zM10 15a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-white/90">
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-4a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
};

export const ToastContainer = () => {
  const [toast, setToast] = useState<Toast | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<number>();
  const removeTimerRef = useRef<number>();

  const clearTimers = () => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (removeTimerRef.current) window.clearTimeout(removeTimerRef.current);
  };

  useEffect(() => {
    const addToast = (message: string, type: ToastType = "default") => {
      const id = Math.random().toString(36).slice(2, 11);
      clearTimers();
      setToast({ id, message, type, createdAt: Date.now() });
      setVisible(true);

      hideTimerRef.current = window.setTimeout(() => {
        setVisible(false);
        removeTimerRef.current = window.setTimeout(() => {
          setToast((current) => (current?.id === id ? null : current));
        }, TOAST_EXIT_MS);
      }, TOAST_VISIBLE_MS);
    };

    toastQueue.push(addToast);
    return () => {
      clearTimers();
      const index = toastQueue.indexOf(addToast);
      if (index !== -1) toastQueue.splice(index, 1);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[250] -translate-x-1/2">
      <div
        key={toast.id}
        role="status"
        className={`liquid-glass pointer-events-auto flex max-w-[min(92vw,28rem)] items-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm text-white ${
          visible ? "toast-in" : "toast-out"
        } ${typeClass[toast.type]}`}
      >
        <ToastIcon type={toast.type} />
        <span className="pr-1 leading-snug">{toast.message}</span>
      </div>
    </div>
  );
};

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
