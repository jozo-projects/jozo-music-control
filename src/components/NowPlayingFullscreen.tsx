import { SCREENSAVER_EXIT_MS } from "@/constant/nowPlaying";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

type NowPlayingSong = {
  title: string;
  author: string;
  thumbnail: string;
};

type NowPlayingFullscreenProps = {
  open: boolean;
  song: NowPlayingSong;
  currentTime: number;
  duration: number;
  onClose: () => void;
};

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const NowPlayingFullscreen: React.FC<NowPlayingFullscreenProps> = ({
  open,
  song,
  currentTime,
  duration,
  onClose,
}) => {
  const [isMounted, setIsMounted] = useState(open);
  const [isLeaving, setIsLeaving] = useState(false);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const artwork = song.thumbnail;

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      setIsLeaving(false);
      return;
    }

    if (!isMounted) return;

    setIsLeaving(true);
    const timeoutId = window.setTimeout(() => {
      setIsMounted(false);
      setIsLeaving(false);
    }, SCREENSAVER_EXIT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [open, isMounted]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const dismiss = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (isLeaving) return;
    onClose();
  };

  if (typeof document === "undefined" || !isMounted) return null;

  return ReactDOM.createPortal(
    <div
      className={`now-playing-overlay fixed inset-0 z-[180] cursor-pointer overflow-hidden bg-brand-950 text-white${
        isLeaving ? " is-leaving" : ""
      }`}
      role="dialog"
      tabIndex={0}
      aria-modal="true"
      aria-label="Màn hình chờ đang phát"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={dismiss}
    >
      <img
        src={artwork}
        alt=""
        className="now-playing-backdrop pointer-events-none absolute inset-0 h-full w-full object-cover"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-brand-950/50 to-black/80"
        aria-hidden
      />

      <div className="pointer-events-none relative z-10 flex h-full w-full items-center justify-center px-16 py-14">
        <div className="now-playing-stage relative w-full max-w-3xl">
          <div className="relative aspect-video max-h-[min(58dvh,26rem)] overflow-hidden rounded-[2rem] bg-black/40 shadow-[0_40px_90px_rgba(0,0,0,0.55)] ring-1 ring-white/20">
            <img
              src={artwork}
              alt={song.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          <div className="liquid-glass-player absolute inset-x-[7%] bottom-[8%] rounded-[1.75rem] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight sm:text-xl">
                  {song.title}
                </p>
                <p className="mt-0.5 truncate text-sm text-white/70 sm:text-base">
                  {song.author}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 text-xs text-white/70 sm:text-sm">
              <span className="w-10 shrink-0 tabular-nums">
                {formatTime(currentTime)}
              </span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.35)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right tabular-nums">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-6 left-0 right-0 z-10 text-center text-sm tracking-wide text-white/55">
        Chạm để tiếp tục
      </p>
    </div>,
    document.body,
  );
};

export default NowPlayingFullscreen;
