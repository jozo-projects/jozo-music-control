import Modal from "@/components/Modal";
import { useQueueMutations } from "@/hooks/useQueueMutations"; // Đường dẫn file hook
import React, { useState } from "react";
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
    const { addSongToQueue } = useQueueMutations();
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get("roomId") || "";

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

    return (
      <>
        <div
          className="shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer user-select-none"
          onClick={() => setIsModalOpen(true)}
        >
          <img
            src={thumbnail}
            alt={title}
            loading="lazy"
            className="w-full h-40 object-cover user-select-none"
          />
          <div className="p-4 bg-black/60">
            <h3 className="text-sm font-semibold mb-1 line-clamp-2 min-h-10 user-select-none">
              {title}
            </h3>
            <p className="text-xs text-gray-500 truncate user-select-none">
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
        />
      </>
    );
  }
);

SongCard.displayName = "SongCard";

export default SongCard;
