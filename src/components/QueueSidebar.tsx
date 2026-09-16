import RemoveIcon from "@/assets/icons/RemoveIcon";
import {
  useRemoveAllSongs,
  useRemoveSongFromQueue,
  useUpdateQueueOrder,
  usePlayChosenSong,
} from "@/hooks/useQueueMutations";
import { useQueueQuery } from "@/hooks/useQueueQuery";
import { useNowPlayingExpand } from "@/contexts/NowPlayingExpandContext";
import { useSocket } from "@/contexts/SocketContext";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
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
  isOpen?: boolean;
}

interface Song {
  title: string;
  author: string;
  thumbnail: string;
  video_id: string;
}

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
      <div className="liquid-glass w-full max-w-md rounded-3xl p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45)]">
        <h2 className="mb-4 text-lg font-bold text-white">Phát ngay bài hát</h2>
        <div className="mb-5 flex items-center gap-3">
          <img
            src={song.thumbnail}
            alt={song.title}
            className="size-16 rounded-xl object-cover ring-1 ring-primary/40"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{song.title}</p>
            <p className="truncate text-sm text-white/55">{song.author}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onPlayNow}
          className="flex w-full flex-col items-center gap-y-2 rounded-2xl border border-primary/40 bg-primary/80 px-4 py-3 text-sm font-medium text-primary-foreground shadow-brand-soft transition-colors hover:bg-primary"
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
          Phát ngay
        </button>

        <button
          type="button"
          onClick={onClose}
          className="liquid-glass-btn mt-3 flex w-full items-center justify-center gap-x-2 rounded-2xl py-2.5 text-white/85"
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
    document.body,
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
    opacity: isDragging ? 0.7 : 1,
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
      },
    );
    setShowPlayPopup(false);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        onClick={handleItemClick}
        className={`mb-2 flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-xl bg-white/[0.07] p-2 ring-1 ring-white/10 ${
          isDragging ? "shadow-brand-glow ring-white/25" : ""
        }`}
      >
        <div className="relative shrink-0">
          <img
            src={song.thumbnail}
            alt=""
            className="size-11 rounded-lg object-cover ring-1 ring-white/10"
          />
          <span className="absolute -left-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-brand-soft">
            {idx + 1}
          </span>
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-white select-none">
            {song.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-white/55 select-none">
            {song.author}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-0.5">
          <div
            {...listeners}
            className="cursor-grab touch-none select-none rounded-md p-1 text-white/40 hover:text-white/80 active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            aria-label="Kéo để sắp xếp"
            role="button"
          >
            <DragHandleIcon className="size-4" />
          </div>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md text-white/50 hover:bg-white/10 hover:text-white"
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

      <PlayNowModal
        isOpen={showPlayPopup}
        onClose={handleClosePopup}
        onPlayNow={handlePlayNow}
        song={song}
      />
    </>
  );
};

const QueueSidebar: React.FC<QueueSidebarProps> = ({ isOpen = true }) => {
  const { data: queueData } = useQueueQuery();
  const { expand } = useNowPlayingExpand();

  const { mutate: removeSongFromQueue } = useRemoveSongFromQueue();

  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";

  const [items, setItems] = React.useState(queueData?.result?.queue || []);

  const { mutate: removeAllSongs } = useRemoveAllSongs();

  const { mutate: updateQueueOrder } = useUpdateQueueOrder();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

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
        (item, idx) => `${idx}-${item.title}` === active.id,
      );
      const newIndex = items.findIndex(
        (item, idx) => `${idx}-${item.title}` === over.id,
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

  const nowPlaying = queueData?.result?.nowPlaying;
  const queueCount = items.length;

  return (
    <div
      className={`flex h-full min-h-0 w-full flex-col py-4 text-white ${
        isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-100"
      }`}
    >
      <div className="liquid-glass flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
        {nowPlaying && (
          <div className="shrink-0 px-3.5 pb-3 pt-3.5">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="now-playing-eq" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
                <h3 className="text-sm font-semibold text-white/70">Đang phát</h3>
              </div>
              <span className="text-[10px] text-white/45">Toàn màn hình</span>
            </div>
            <button
              type="button"
              onClick={expand}
              className="flex min-w-0 w-full items-center gap-3 rounded-xl text-left transition-colors hover:bg-white/5"
              aria-label="Mở toàn màn hình bài đang phát"
            >
              <span className="relative shrink-0">
                <img
                  src={nowPlaying.thumbnail}
                  alt={nowPlaying.title}
                  className="size-14 rounded-xl object-cover ring-1 ring-primary/45"
                />
                <span className="liquid-glass-orb absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="size-3"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 9V3.75H9M20.25 9V3.75H15M20.25 15v5.25H15M3.75 15v5.25H9"
                    />
                  </svg>
                </span>
              </span>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-white select-none">
                  {nowPlaying.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-white/55 select-none">
                  {nowPlaying.author}
                </p>
              </div>
            </button>
          </div>
        )}

        {nowPlaying && <div className="mx-3.5 h-px bg-primary/25" />}

        <div
          className="queue-scroll min-h-0 flex-1 overflow-y-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="px-3.5 pb-4 pt-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-white/70">
                <span className="truncate">Danh sách chờ</span>
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/35 px-1.5 text-[11px] font-semibold text-white">
                  {queueCount}
                </span>
              </h3>
              {queueCount > 0 && (
                <button
                  type="button"
                  className="liquid-glass-btn flex size-8 shrink-0 items-center justify-center rounded-xl text-white/70"
                  onClick={handleRemoveAll}
                  aria-label="Xóa hết"
                >
                  <RemoveIcon />
                </button>
              )}
            </div>

            {queueCount === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 px-4 py-10 text-center">
                <p className="text-sm text-white/55">
                  Chưa có bài hát trong hàng chờ
                </p>
                <p className="mt-1 text-xs text-white/35">
                  Chọn một bài để thêm vào danh sách
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((song, idx) => `${idx}-${song.title}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="w-full min-w-0">
                    {items.map((song, idx) => (
                      <SortableQueueItem
                        key={`${idx}-${song.title}`}
                        song={song}
                        idx={idx}
                        onRemove={(index) => {
                          removeSongFromQueue({
                            videoIndex: index,
                            roomId: roomId,
                          });
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueSidebar;
