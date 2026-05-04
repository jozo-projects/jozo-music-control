import { useSocket } from "@/contexts/SocketContext";
import { useBookingCodeQuery } from "@/hooks/useBookingCodeQuery";
import { useAddAllSongs, useQueueMutations } from "@/hooks/useQueueMutations";
import React, { useState } from "react";

interface BookingSongListProps {
  bookingCode: string;
  roomId: string;
  onClose: VoidFunction;
  onClearCode: VoidFunction;
}

const BookingSongList: React.FC<BookingSongListProps> = ({
  bookingCode,
  roomId,
  onClose,
  onClearCode,
}) => {
  const { data, isLoading, isError } = useBookingCodeQuery(bookingCode);
  const { mutate: addAllSongs } = useAddAllSongs();
  const { addSongToQueue } = useQueueMutations();
  const { socket } = useSocket();
  const [addedSongs, setAddedSongs] = useState<Set<string>>(new Set());

  const handleAddSong = (
    song: {
      video_id: string;
      title: string;
      thumbnail: string;
      author: string;
      duration: number;
      position: "top" | "end";
    },
    index: number
  ) => {
    const key = `${song.video_id}-${index}`;
    if (addedSongs.has(key)) return;

    addSongToQueue.mutate(
      {
        song: {
          video_id: song.video_id,
          title: song.title,
          thumbnail: song.thumbnail,
          author: song.author,
          duration: song.duration,
        },
        position: song.position,
        roomId,
      },
      {
        onSuccess: () => {
          setAddedSongs((prev) => new Set(prev).add(key));
          socket?.emit("get_now_playing", { roomId });
        },
      }
    );
  };

  const onAddAll = () => {
    if (!data?.result || data.result.length === 0) return;

    // Chuyển đổi data để phù hợp với Video type
    const songs: Video[] = data.result.map((song) => ({
      video_id: song.video_id,
      title: song.title,
      thumbnail: song.thumbnail,
      author: song.author,
      duration: song.duration,
    }));

    addAllSongs(
      {
        roomId,
        songs,
      },
      {
        onSuccess: () => {
          // Đánh dấu tất cả các bài hát là đã thêm
          if (data?.result) {
            const allKeys = new Set(
              data.result.map((song, index) => `${song.video_id}-${index}`)
            );
            setAddedSongs(allKeys);
          }
          socket?.emit("get_now_playing", { roomId });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 font-semibold mb-4">
          Mã đặt chỗ không hợp lệ hoặc không tìm thấy
        </div>
        <button
          onClick={onClearCode}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!data?.result || data.result.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600 mb-4">Không có bài hát nào</div>
        <button
          onClick={onClearCode}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">
        Tìm thấy {data.result.length} bài hát
      </div>
      <div className="max-h-96 overflow-y-auto">
        {data.result.map((song, index) => {
          const key = `${song.video_id}-${index}`;
          const isAdded = addedSongs.has(key);
          const durationMinutes = Math.floor(song.duration / 60);
          const durationSeconds = song.duration % 60;
          const durationString = `${durationMinutes}:${durationSeconds
            .toString()
            .padStart(2, "0")}`;

          return (
            <div
              key={`${song.video_id}-${index}`}
              className="flex items-center space-x-4 mb-4 p-3 rounded-lg hover:bg-gray-50"
            >
              <img
                src={song.thumbnail}
                alt={song.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{song.title}</p>
                <p className="text-sm text-gray-600 truncate">{song.author}</p>
                <p className="text-xs text-gray-400">{durationString}</p>
              </div>
              <button
                onClick={() => handleAddSong(song, index)}
                disabled={isAdded}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  isAdded
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary-hover"
                }`}
              >
                {isAdded ? "Đã thêm" : "Thêm"}
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-x-3 mt-4">
        <button
          onClick={onClearCode}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Nhập mã khác
        </button>
        <button
          onClick={onAddAll}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
        >
          Thêm tất cả
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
        >
          Hoàn tất
        </button>
      </div>
    </div>
  );
};

export default BookingSongList;
