import Modal from "@/components/Modal";
import { useQueueAdd } from "@/contexts/QueueAddContext";
import React, { useCallback, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface SongCardProps {
  video_id: string;
  title: string;
  thumbnail: string;
  author: string;
  duration: number;
  url?: string;
}

const SongCard: React.FC<SongCardProps> = React.memo(
  ({ video_id, title, thumbnail, author, duration, url }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { addSongToQueue } = useQueueAdd();
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get("roomId") || "";
    const openedAtRef = useRef(0);

    const openModal = useCallback(() => {
      const now = Date.now();
      if (now - openedAtRef.current < 300) return;
      openedAtRef.current = now;
      setIsModalOpen(true);
    }, []);

    /** Tablet: input search đang focus thì tap card thường không fire click — xử lý trực tiếp */
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      const active = document.activeElement;
      if (!(active instanceof HTMLInputElement)) return;
      e.preventDefault();
      active.blur();
      openModal();
    };

    const handleAddToTop = () => {
      addSongToQueue.mutate(
        {
          song: { video_id, title, thumbnail, author, duration, url },
          position: "top",
          roomId,
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
          },
        }
      );
    };

    const handleAddToEnd = () => {
      addSongToQueue.mutate(
        {
          song: { video_id, title, thumbnail, author, duration, url },
          position: "end",
          roomId,
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
          },
        }
      );
    };

    const addQueuePending =
      addSongToQueue.isPending && addSongToQueue.variables
        ? addSongToQueue.variables.position
        : null;

    return (
      <>
        <div
          className="liquid-glass-card cursor-pointer overflow-hidden rounded-2xl transition-transform duration-200 active:scale-[0.99] touch-manipulation select-none"
          onTouchStart={handleTouchStart}
          onClick={openModal}
        >
          <div className="relative">
            <img
              src={thumbnail}
              alt={title}
              loading="lazy"
              className="pointer-events-none h-40 w-full object-cover select-none"
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent"
              aria-hidden
            />
          </div>
          <div className="border-t border-primary/30 px-3 py-2.5">
            <h3 className="mb-1 line-clamp-2 min-h-10 text-sm font-semibold text-white select-none">
              {title}
            </h3>
            <p className="truncate text-xs text-white/55 select-none">
              {author}
            </p>
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddToTop={handleAddToTop}
          onAddToEnd={handleAddToEnd}
          songTitle={title}
          addQueuePending={addQueuePending}
        />
      </>
    );
  }
);

SongCard.displayName = "SongCard";

export default SongCard;
