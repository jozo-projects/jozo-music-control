/* eslint-disable @typescript-eslint/no-explicit-any */
import ForwardIcon from "@/assets/icons/ForwardIcon";
import PauseIcon from "@/assets/icons/PauseIcon";
import PlayIcon from "@/assets/icons/PlayIcon";
import {
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMediumIcon,
  VolumeMutedIcon,
} from "@/assets/icons/VolumeIcons";
import { PlaybackState } from "@/constant/enum";
import { usePlayNextSong } from "@/hooks/useQueueMutations";
import { useQueueQuery } from "@/hooks/useQueueQuery";
import { useSocket } from "@/contexts/SocketContext";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { debounce } from "lodash";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  onToggleQueue: () => void;
};

interface Video {
  video_id: string;
  title: string;
  thumbnail: string;
  duration: number;
  author: string;
}

interface ApiResponse<T> {
  result: T;
  // thêm các trường khác nếu cần
}

const ControlBar: React.FC<Props> = ({ onToggleQueue }: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { socket } = useSocket(); // Use shared socket from context
  const [params] = useSearchParams();
  const roomId = params.get("roomId") || "";
  const lastTimeUpdateRef = useRef<number>(0);
  const [volume, setVolume] = useState(50);

  const { data: queueData, refetch } = useQueueQuery();

  const { mutate: playNextSong, isPending: isNextSongPending } =
    usePlayNextSong();

  const duration = queueData?.result.nowPlaying?.duration || 0;

  const queryClient = useQueryClient();

  // Use refs for frequently changing values to avoid useEffect re-runs
  const isPlayingRef = useRef(isPlaying);
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(duration);

  // Update refs when values change
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    if (!socket) return;

    // Theo dõi thời gian hiện tại và kiểm tra nếu gần hết bài
    const checkEndOfSong = () => {
      const currentIsPlaying = isPlayingRef.current;
      const currentCurrentTime = currentTimeRef.current;
      const currentDuration = durationRef.current;

      if (currentIsPlaying && currentDuration > 0 && currentCurrentTime > 0) {
        const timeRemaining = currentDuration - currentCurrentTime;

        // Increase threshold to 3 seconds to account for the 3-second interval
        if (timeRemaining <= 3) {
          if (queueData?.result?.queue?.length && !isNextSongPending) {
            socket?.emit("remove_current_song", { roomId });
            refetch();

            playNextSong(
              { roomId },
              {
                onSuccess: () => {
                  socket?.emit("next_song", { roomId });
                  setCurrentTime(0);
                  setIsPlaying(true);
                  queryClient.invalidateQueries({
                    queryKey: ["queue", roomId],
                  });
                },
              },
            );
          } else if (!queueData?.result?.queue?.length) {
            // console.log("Không còn bài trong queue, kết thúc phát nhạc");

            // Cập nhật trạng thái local trước
            queryClient.setQueryData(
              ["queue", roomId],
              (
                oldData:
                  | ApiResponse<{ nowPlaying: Video; queue: Video[] }>
                  | undefined,
              ) => ({
                ...oldData,
                result: {
                  ...oldData?.result,
                  nowPlaying: null,
                  queue: [],
                },
              }),
            );

            // Sau đó emit các sự kiện
            socket?.emit("remove_current_song", { roomId });
            socket?.emit("clear_room_data", { roomId });
            socket?.emit("song_ended", { roomId });

            // Reset trạng thái phát nhạc
            setCurrentTime(0);
            setIsPlaying(false);
          }
        }
      }
    };

    // Kiểm tra mỗi 1 giây
    const intervalId = setInterval(checkEndOfSong, 1000);

    socket.on("time_updated", (data: any) => {
      if (!isDragging) {
        const newTime = data.currentTime || 0;
        const currentCurrentTime = currentTimeRef.current;
        const currentIsPlaying = isPlayingRef.current;

        // Chỉ cập nhật currentTime khi:
        // 1. Sự khác biệt thời gian đủ lớn (>0.5s)
        // 2. Hoặc khi đang không phát (để đồng bộ chính xác vị trí khi pause)
        if (
          !currentIsPlaying ||
          Math.abs(newTime - currentCurrentTime) > 0.5 ||
          Math.abs(newTime - lastTimeUpdateRef.current) > 0.5
        ) {
          setCurrentTime(newTime);
          lastTimeUpdateRef.current = newTime;
        }
      }
    });

    socket.on("video_event", (data: any) => {
      const currentCurrentTime = currentTimeRef.current;

      if (data.event === PlaybackState.PLAY) {
        setIsPlaying(true);
        // Chỉ cập nhật currentTime nếu có sự khác biệt đáng kể
        if (Math.abs(data.currentTime - currentCurrentTime) > 0.5) {
          setCurrentTime(data.currentTime || 0);
        }
      } else if (data.event === PlaybackState.PAUSE) {
        setIsPlaying(false);
        // Chỉ cập nhật currentTime nếu có sự khác biệt đáng kể
        if (Math.abs(data.currentTime - currentCurrentTime) > 0.5) {
          setCurrentTime(data.currentTime || 0);
        }
      } else if (data.event === PlaybackState.SEEK) {
        setCurrentTime(data.currentTime || 0);
      }
    });

    socket.on("play_song", (data: any) => {
      if (data) {
        setIsPlaying(true);
        setCurrentTime(0);
      }
    });

    socket.on("now_playing_cleared", () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    socket.on("song_ended", () => {
      // Chỉ xóa now playing và reset trạng thái khi không còn bài hát nào trong queue
      if (!queueData?.result?.queue?.length) {
        socket?.emit("song_ended", {
          roomId,
        });

        // Cập nhật lại trạng thái local
        queryClient.setQueryData(
          ["queue", roomId],
          (
            oldData:
              | ApiResponse<{ nowPlaying: Video; queue: Video[] }>
              | undefined,
          ) => ({
            ...oldData,
            result: {
              ...oldData?.result,
              nowPlaying: null,
              queue: [], // Đảm bảo queue cũng được reset
            },
          }),
        );

        // Reset các trạng thái phát nhạc
        setIsPlaying(false);
        setCurrentTime(0);
      }
    });

    socket.on("volumeChange", (newVolume: number) => {
      setVolume(newVolume);
    });

    return () => {
      clearInterval(intervalId);
      // Remove event listeners instead of disconnecting socket
      socket.off("time_updated");
      socket.off("video_event");
      socket.off("play_song");
      socket.off("now_playing_cleared");
      socket.off("song_ended");
      socket.off("volumeChange");
    };
  }, [
    socket,
    isDragging,
    roomId,
    playNextSong,
    queueData?.result?.queue?.length,
    queryClient,
    isNextSongPending,
    refetch,
  ]); // Removed currentTime, isPlaying, and duration from dependencies

  const handlePlayback = () => {
    if (!queueData?.result.nowPlaying) return;

    const action = isPlaying ? PlaybackState.PAUSE : PlaybackState.PLAY;
    setIsPlaying(!isPlaying);
    sendPlaybackEvent(action);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleSeek = (time: number) => {
    setIsDragging(false);
    setCurrentTime(time);

    if (socket) {
      socket.emit("video_event", {
        roomId,
        videoId: queueData?.result.nowPlaying?.video_id,
        event: PlaybackState.SEEK,
        currentTime: time,
      });
    }
  };

  const debouncedSeek = useCallback(
    debounce((time: number) => {
      if (socket) {
        socket.emit("video_event", {
          roomId,
          videoId: queueData?.result.nowPlaying?.video_id,
          event: PlaybackState.SEEK,
          currentTime: time,
        });
      }
    }, 200),
    [socket, roomId, queueData],
  );

  const handleDrag = (value: number) => {
    setCurrentTime(value);
    debouncedSeek(value);
  };

  const sendPlaybackEvent = (action: PlaybackState) => {
    if (socket && queueData?.result.nowPlaying) {
      socket.emit("video_event", {
        roomId,
        videoId: queueData.result.nowPlaying.video_id,
        event: action,
        currentTime: currentTime,
      });
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Thêm biến để kiểm tra
  const isNowPlaying = !!queueData?.result.nowPlaying;
  const displayCurrentTime = isNowPlaying ? currentTime : 0;
  const displayDuration = isNowPlaying ? duration : 0;

  const nowPlayingId = queueData?.result.nowPlaying?.video_id;

  const handleNextSong = useCallback(
    debounce(() => {
      if (isNextSongPending || !queueData?.result?.queue?.length) {
        return;
      }

      socket?.emit("remove_current_song", { roomId });
      playNextSong(
        { roomId },
        {
          onSuccess: () => {
            socket?.emit("next_song", { roomId });
            socket?.emit("get_now_playing", { roomId });
            setCurrentTime(0);
            setIsPlaying(true);
          },
        },
      );
    }, 500),
    [playNextSong, roomId, queueData?.result?.queue?.length, isNextSongPending],
  );

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);

    // Chỉ gửi giá trị volume trực tiếp vì socket đã được gán vào room
    socket?.emit("adjustVolume", newVolume);
  };

  const renderVolumeIcon = () => {
    if (volume === 0) {
      return <VolumeMutedIcon />;
    }

    if (volume <= 33) {
      return <VolumeLowIcon />;
    }

    if (volume <= 66) {
      return <VolumeMediumIcon />;
    }

    return <VolumeHighIcon />;
  };

  return (
    <>
      <div className="bg-black text-white px-6 py-2 flex items-center justify-between shadow-lg gap-x-6 rounded-3xl z-30 mb-4">
        <div className="flex items-center space-x-4 flex-shrink-0">
          {nowPlayingId ? (
            <>
              <img
                src={queueData.result.nowPlaying.thumbnail}
                alt="Current Song"
                className="w-12 h-12 object-cover rounded"
              />
              <div>
                <div className="w-[200px] overflow-hidden">
                  <p className="text-sm font-bold whitespace-nowrap animate-marquee">
                    {queueData.result.nowPlaying.title}
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  {queueData.result.nowPlaying.author}
                </p>
              </div>
            </>
          ) : (
            <div className="text-gray-400">
              Hãy tìm kiếm và thêm bài hát vào danh sách phát
            </div>
          )}
        </div>
        <div className="flex flex-col items-center w-full gap-y-4">
          <div className="flex items-center space-x-6">
            <button
              onClick={handlePlayback}
              disabled={!nowPlayingId}
              className={
                !nowPlayingId
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-80"
              }
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              onClick={handleNextSong}
              disabled={
                !nowPlayingId ||
                !queueData?.result?.queue?.length ||
                isNextSongPending
              }
              className={
                !nowPlayingId ||
                !queueData?.result?.queue?.length ||
                isNextSongPending
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-80"
              }
            >
              <ForwardIcon />
              {isNextSongPending && <span className="ml-1">...</span>}
            </button>
          </div>

          {isNowPlaying ? (
            <div className="w-full flex items-center space-x-2 text-xs text-gray-400">
              <span>{formatTime(displayCurrentTime)}</span>
              <div className="relative flex-1">
                <div className="absolute top-1/2 left-0 h-2 w-full bg-gray-500 rounded-full -translate-y-1/2"></div>
                <input
                  type="range"
                  min={0}
                  max={displayDuration}
                  value={displayCurrentTime}
                  onMouseDown={handleDragStart}
                  onMouseUp={(e) => handleSeek(Number(e.currentTarget.value))}
                  onChange={(e) => handleDrag(Number(e.target.value))}
                  className="absolute z-10 w-full appearance-none bg-transparent h-2 cursor-pointer -translate-y-1/2 
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-lightpink [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-30 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150
                    [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:bg-lightpink [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-30 [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-150
                    [&::-ms-thumb]:appearance-none [&::-ms-thumb]:bg-lightpink [&::-ms-thumb]:w-4 [&::-ms-thumb]:h-4 [&::-ms-thumb]:rounded-full [&::-ms-thumb]:relative [&::-ms-thumb]:z-30 [&::-ms-thumb]:transition-all [&::-ms-thumb]:duration-150"
                  style={{
                    WebkitTapHighlightColor: "transparent",
                  }}
                />
                <div
                  className="absolute z-10 top-1/2 left-0 h-2 bg-lightpink rounded-full -translate-y-1/2 transition-all duration-75"
                  style={{
                    width: `${(displayCurrentTime / displayDuration) * 100}%`,
                  }}
                />
              </div>
              <span>{formatTime(displayDuration)}</span>
            </div>
          ) : (
            <div className="w-full h-4" />
          )}
        </div>

        <div className="flex items-center space-x-6">
          <div className="relative">
            <button
              onClick={onToggleQueue}
              className="text-xl hover:text-blue-500"
            >
              🎵
            </button>
            {!!queueData?.result?.queue?.length &&
              queueData?.result?.queue?.length > 0 && (
                <span className="absolute -top-3 -right-3 bg-lightpink text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {queueData?.result?.queue?.length}
                </span>
              )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-lg text-white">{renderVolumeIcon()}</div>
            <div className="relative w-24">
              <div className="absolute top-1/2 left-0 h-2 w-full bg-gray-500 rounded-full -translate-y-1/2"></div>
              <div
                className="absolute z-10 top-1/2 left-0 h-2 bg-lightpink rounded-full -translate-y-1/2 transition-all duration-75"
                style={{
                  width: `${volume}%`,
                }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="absolute z-10 w-full appearance-none bg-transparent h-2 cursor-pointer -translate-y-1/2
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-lightpink [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-30
                    [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:bg-lightpink [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-30"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ControlBar;
