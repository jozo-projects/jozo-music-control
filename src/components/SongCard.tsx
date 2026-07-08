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
}

const SongCard: React.FC<SongCardProps> = React.memo(
  ({ video_id, title, thumbnail, author, duration }) => {
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
          song: { video_id, title, thumbnail, author, duration },
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
          song: { video_id, title, thumbnail, author, duration },
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
          className="shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer touch-manipulation select-none"
          onTouchStart={handleTouchStart}
          onClick={openModal}
        >
          <img
            src={thumbnail}
            alt={title}
            loading="lazy"
            className="pointer-events-none h-40 w-full object-cover select-none"
          />
          <div className="p-4 bg-brand-950/90 border-t-2 border-primary/40">
            <h3 className="mb-1 line-clamp-2 min-h-10 text-sm font-semibold select-none">
              {title}
            </h3>
            <p className="truncate text-xs text-gray-500 select-none">
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
