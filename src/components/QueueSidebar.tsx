import RemoveIcon from "@/assets/icons/RemoveIcon";
import {
  useRemoveAllSongs,
  useRemoveSongFromQueue,
  useUpdateQueueOrder,
  usePlayChosenSong,
} from "@/hooks/useQueueMutations";
import { useQueueQuery } from "@/hooks/useQueueQuery";
import { useSocket } from "@/contexts/SocketContext";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragHandleIcon from "@/assets/icons/DragHandleIcon";
import ReactDOM from "react-dom";
import { useQueryClient } from "@tanstack/react-query";

interface QueueSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Song {
  title: string;
  author: string;
  thumbnail: string;
  video_id: string;
}

// Play Now Modal Component as a portal
const PlayNowModal = ({
  isOpen,
  onClose,
  onPlayNow,
  song,
}: {
  isOpen: boolean;
  onClose: (e: React.MouseEvent) => void;
  onPlayNow: (e: React.MouseEvent) => void;
  song: Song;
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full md:w-3/4 lg:w-1/2 xl:w-1/3 rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Phát ngay bài hát
        </h2>
        <div className="flex items-center mb-4">
          <img
            src={song.thumbnail}
            alt={song.title}
            className="w-16 h-16 object-cover rounded-lg mr-4"
          />
          <div>
            <p className="font-bold text-gray-900">{song.title}</p>
            <p className="text-gray-700">{song.author}</p>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={onPlayNow}
            className="bg-lightpink text-gray-900 py-2 w-full px-4 rounded-lg hover:bg-opacity-80 flex flex-col items-center gap-y-2"
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
                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
              />
            </svg>
            Phát Ngay
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 px-4 rounded-lg text-gray-900 hover:bg-lightpink hover:bg-opacity-20 flex items-center gap-x-2 justify-center"
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
    </div>,
    document.body
  );
};

const SortableQueueItem = ({
  song,
  idx,
  onRemove,
}: {
  song: Song;
  idx: number;
  onRemove: (idx: number) => void;
}) => {
  const [showPlayPopup, setShowPlayPopup] = useState(false);
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { mutate: playChosenSong } = usePlayChosenSong();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${idx}-${song.title}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: isDragging ? "none" : "auto",
    zIndex: isDragging ? 1000 : 1,
    position: "relative" as const,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? "rgba(255, 255, 255, 0.1)" : "transparent",
  };

  const handleItemClick = () => {
    setShowPlayPopup(true);
  };

  const handleClosePopup = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPlayPopup(false);
  };

  const handlePlayNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    playChosenSong(
      {
        roomId,
        videoIndex: idx,
      },
      {
        onSuccess: () => {
          socket?.emit("next_song", { roomId });
          socket?.emit("get_now_playing", { roomId });
          queryClient.invalidateQueries({
            queryKey: ["queue", roomId],
          });
        },
      }
    );
    setShowPlayPopup(false);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={`flex items-center space-x-4 mb-4 relative rounded-lg p-2 transition-colors${
          isDragging ? "shadow-lg" : ""
        }`}
      >
        <div className="flex items-center space-x-4 w-full">
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white touch-none select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <DragHandleIcon />
          </div>
          <div
            className="flex items-center space-x-4 w-full cursor-pointer"
            onClick={handleItemClick}
          >
            <img
              src={song.thumbnail}
              alt={song.title}
              className="w-12 h-12 object-cover rounded-lg"
            />
            <div className="flex justify-between items-center w-full max-w-[calc(100%-56px)]">
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate marquee hover:marquee-animation max-w-[200px] user-select-none">
                  {song.title}
                </p>
                <p className="text-sm text-gray-400 truncate marquee-text hover:marquee-animation user-select-none">
                  {song.author}
                </p>
              </div>
              <button
                className="p-2 text-gray-400 hover:text-white transition-colors flex items-center min-w-[40px] min-h-[40px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(idx);
                }}
                aria-label="Xóa bài hát"
              >
                <RemoveIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Play Now Modal as Portal */}
      <PlayNowModal
        isOpen={showPlayPopup}
        onClose={handleClosePopup}
        onPlayNow={handlePlayNow}
        song={song}
      />
    </>
  );
};

const QueueSidebar: React.FC<QueueSidebarProps> = ({
  isOpen = true,
  onClose,
}) => {
  const { data: queueData } = useQueueQuery();

  const { mutate: removeSongFromQueue } = useRemoveSongFromQueue();

  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";

  const [items, setItems] = React.useState(queueData?.result?.queue || []);

  const { mutate: removeAllSongs } = useRemoveAllSongs();

  const { mutate: updateQueueOrder } = useUpdateQueueOrder();

  const handleRemoveAll = () => {
    removeAllSongs({ roomId: roomId });
  };

  useEffect(() => {
    setItems(queueData?.result?.queue || []);
  }, [queueData?.result?.queue]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!active || !over) return;

    if (active.id !== over.id) {
      const oldIndex = items.findIndex(
        (item, idx) => `${idx}-${item.title}` === active.id
      );
      const newIndex = items.findIndex(
        (item, idx) => `${idx}-${item.title}` === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const result = arrayMove(items, oldIndex, newIndex);
        setItems(result);
        updateQueueOrder({
          roomId: roomId,
          queue: result,
        });
      }
    }
  };

  return (
    <div
      className={`w-full bg-transparent text-white transition-all duration-200 z-40 shadow-md ${
        isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-100"
      }`}
    >
      <div className="flex flex-col h-[100vh]">
        {/* Close Button */}
        <div className="p-4 flex justify-between items-center border-b border-gray-700">
          <h2 className="text-lg font-bold">Danh sách</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✖
          </button>
        </div>

        {/* Now Playing */}
        {queueData?.result?.nowPlaying && (
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400">Đang phát</h3>
            <div className="flex items-center space-x-4 mt-3">
              <img
                src={queueData?.result?.nowPlaying?.thumbnail}
                alt={queueData?.result?.nowPlaying?.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div>
                <p className="font-bold truncate user-select-none">
                  {queueData?.result?.nowPlaying?.title}
                </p>
                <p className="text-sm text-gray-400 truncate user-select-none">
                  {queueData?.result?.nowPlaying?.author}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Waiting Queue - phần scroll */}
        <div
          className="flex-1 min-h-0 overflow-y-auto bg-black/50"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div
            className="p-4"
            style={{
              paddingBottom: `${Math.max(
                100,
                (queueData?.result?.queue?.length || 0) * 10
              )}px`,
            }}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-semibold text-gray-400">
                Danh sách chờ
              </h3>
              {!!queueData?.result?.queue?.length && (
                <button
                  className="text-gray-400 hover:text-white flex items-center gap-x-3 p-2"
                  onClick={handleRemoveAll}
                >
                  Xóa tất cả
                  <RemoveIcon />
                </button>
              )}
            </div>
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((song, idx) => `${idx}-${song.title}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="overflow-visible pb-20">
                  {items.map((song, idx) => (
                    <SortableQueueItem
                      key={`${idx}-${song.title}`}
                      song={song}
                      idx={idx}
                      onRemove={(idx) => {
                        removeSongFromQueue({
                          videoIndex: idx,
                          roomId: roomId,
                        });
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueSidebar;
