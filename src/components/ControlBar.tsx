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
import NowPlayingFullscreen from "@/components/NowPlayingFullscreen";
import { useNowPlayingExpand } from "@/contexts/NowPlayingExpandContext";
import { usePlayNextSong } from "@/hooks/useQueueMutations";
import { useQueueQuery } from "@/hooks/useQueueQuery";
import { useSocket } from "@/contexts/SocketContext";
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { debounce } from "lodash";
import { useQueryClient } from "@tanstack/react-query";

interface Video {
  video_id: string;
  title: string;
  thumbnail: string;
  duration: number;
  author: string;
}

interface ApiResponse<T> {
  result: T;
}

const ControlBar: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { socket } = useSocket();
  const [params] = useSearchParams();
  const roomId = params.get("roomId") || "";
  const lastTimeUpdateRef = useRef<number>(0);
  const [volume, setVolume] = useState(50);

  const { data: queueData, refetch } = useQueueQuery();
  const { isExpanded, expand, collapse } = useNowPlayingExpand();

  const { mutate: playNextSong, isPending: isNextSongPending } =
    usePlayNextSong();

  const duration = queueData?.result.nowPlaying?.duration || 0;
  const nowPlayingId = queueData?.result.nowPlaying?.video_id;

  const queryClient = useQueryClient();

  const isPlayingRef = useRef(isPlaying);
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(duration);
  const isDraggingRef = useRef(isDragging);
  const queueLengthRef = useRef(queueData?.result?.queue?.length ?? 0);
  const isNextSongPendingRef = useRef(isNextSongPending);
  const endOfSongHandledRef = useRef(false);
  const nowPlayingIdRef = useRef(nowPlayingId);
  const socketRef = useRef(socket);
  const roomIdRef = useRef(roomId);
  const nowPlayingVideoIdRef = useRef(nowPlayingId);
  const playNextSongRef = useRef(playNextSong);
  const refetchRef = useRef(refetch);

  isPlayingRef.current = isPlaying;
  currentTimeRef.current = currentTime;
  durationRef.current = duration;
  isDraggingRef.current = isDragging;
  queueLengthRef.current = queueData?.result?.queue?.length ?? 0;
  isNextSongPendingRef.current = isNextSongPending;
  socketRef.current = socket;
  roomIdRef.current = roomId;
  nowPlayingVideoIdRef.current = nowPlayingId;
  playNextSongRef.current = playNextSong;
  refetchRef.current = refetch;

  useEffect(() => {
    if (nowPlayingIdRef.current !== nowPlayingId) {
      endOfSongHandledRef.current = false;
      nowPlayingIdRef.current = nowPlayingId;
    }
  }, [nowPlayingId]);

  useEffect(() => {
    if (duration > 0 && currentTime < duration - 5) {
      endOfSongHandledRef.current = false;
    }
  }, [currentTime, duration]);

  // Socket listeners — chỉ gắn lại khi socket hoặc roomId đổi
  useEffect(() => {
    if (!socket) return;

    const onTimeUpdated = (data: any) => {
      if (isDraggingRef.current) return;

      if (typeof data.isPlaying === "boolean") {
        setIsPlaying(data.isPlaying);
      }

      const newTime = data.currentTime || 0;
      const currentCurrentTime = currentTimeRef.current;
      const currentIsPlaying = isPlayingRef.current;

      if (
        !currentIsPlaying ||
        Math.abs(newTime - currentCurrentTime) > 0.5 ||
        Math.abs(newTime - lastTimeUpdateRef.current) > 0.5
      ) {
        setCurrentTime(newTime);
        lastTimeUpdateRef.current = newTime;
      }
    };

    const onVideoEvent = (data: any) => {
      const currentCurrentTime = currentTimeRef.current;

      if (data.event === PlaybackState.PLAY) {
        setIsPlaying(true);
        if (Math.abs(data.currentTime - currentCurrentTime) > 0.5) {
          setCurrentTime(data.currentTime || 0);
        }
      } else if (data.event === PlaybackState.PAUSE) {
        setIsPlaying(false);
        if (Math.abs(data.currentTime - currentCurrentTime) > 0.5) {
          setCurrentTime(data.currentTime || 0);
        }
      } else if (data.event === PlaybackState.SEEK) {
        setCurrentTime(data.currentTime || 0);
      }
    };

    const onPlaySong = (data: any) => {
      if (data) {
        setIsPlaying(true);
        setCurrentTime(0);
        endOfSongHandledRef.current = false;
      }
    };

    // Đồng bộ play/pause + thời gian khi reload / join lại room
    const onNowPlaying = (data: any) => {
      if (!data) return;

      if (typeof data.isPlaying === "boolean") {
        setIsPlaying(data.isPlaying);
      }

      if (typeof data.currentTime === "number") {
        setCurrentTime(data.currentTime);
        lastTimeUpdateRef.current = data.currentTime;
      }

      endOfSongHandledRef.current = false;
    };

    const onNowPlayingCleared = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      endOfSongHandledRef.current = false;
    };

    const onSongEnded = () => {
      if (!queueLengthRef.current) {
        socket.emit("song_ended", { roomId: roomIdRef.current });

        queryClient.setQueryData(
          ["queue", roomIdRef.current],
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

        setIsPlaying(false);
        setCurrentTime(0);
        endOfSongHandledRef.current = false;
      }
    };

    const onVolumeChange = (newVolume: number) => {
      setVolume(newVolume);
    };

    socket.on("time_updated", onTimeUpdated);
    socket.on("video_event", onVideoEvent);
    socket.on("play_song", onPlaySong);
    socket.on("now_playing", onNowPlaying);
    socket.on("now_playing_cleared", onNowPlayingCleared);
    socket.on("song_ended", onSongEnded);
    socket.on("volumeChange", onVolumeChange);

    socket.emit("get_now_playing", { roomId });

    return () => {
      socket.off("time_updated", onTimeUpdated);
      socket.off("video_event", onVideoEvent);
      socket.off("play_song", onPlaySong);
      socket.off("now_playing", onNowPlaying);
      socket.off("now_playing_cleared", onNowPlayingCleared);
      socket.off("song_ended", onSongEnded);
      socket.off("volumeChange", onVolumeChange);
    };
  }, [socket, roomId, queryClient]);

  // Kiểm tra cuối bài — tách riêng, dùng ref để tránh gắn lại listener
  useEffect(() => {
    if (!socket) return;

    const checkEndOfSong = () => {
      if (endOfSongHandledRef.current) return;

      const currentIsPlaying = isPlayingRef.current;
      const currentCurrentTime = currentTimeRef.current;
      const currentDuration = durationRef.current;

      if (currentIsPlaying && currentDuration > 0 && currentCurrentTime > 0) {
        const timeRemaining = currentDuration - currentCurrentTime;

        if (timeRemaining <= 3) {
          if (queueLengthRef.current && !isNextSongPendingRef.current) {
            endOfSongHandledRef.current = true;

            socket.emit("remove_current_song", { roomId: roomIdRef.current });
            refetchRef.current();

            playNextSongRef.current(
              { roomId: roomIdRef.current },
              {
                onSuccess: () => {
                  socket.emit("next_song", { roomId: roomIdRef.current });
                  setCurrentTime(0);
                  setIsPlaying(true);
                  queryClient.invalidateQueries({
                    queryKey: ["queue", roomIdRef.current],
                  });
                },
                onError: () => {
                  endOfSongHandledRef.current = false;
                },
              },
            );
          } else if (!queueLengthRef.current) {
            endOfSongHandledRef.current = true;

            queryClient.setQueryData(
              ["queue", roomIdRef.current],
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

            socket.emit("remove_current_song", { roomId: roomIdRef.current });
            socket.emit("clear_room_data", { roomId: roomIdRef.current });
            socket.emit("song_ended", { roomId: roomIdRef.current });

            setCurrentTime(0);
            setIsPlaying(false);
          }
        }
      }
    };

    const intervalId = setInterval(checkEndOfSong, 1000);
    return () => clearInterval(intervalId);
  }, [socket, roomId, queryClient]);

  const debouncedSeekRef = useRef(
    debounce((time: number) => {
      const currentSocket = socketRef.current;
      const videoId = nowPlayingVideoIdRef.current;
      if (currentSocket && videoId) {
        currentSocket.emit("video_event", {
          roomId: roomIdRef.current,
          videoId,
          event: PlaybackState.SEEK,
          currentTime: time,
        });
      }
    }, 200),
  );

  useEffect(() => {
    const debouncedSeek = debouncedSeekRef.current;
    return () => debouncedSeek.cancel();
  }, []);

  const handleNextSongRef = useRef(
    debounce(() => {
      if (
        isNextSongPendingRef.current ||
        !queueLengthRef.current
      ) {
        return;
      }

      const currentSocket = socketRef.current;
      if (!currentSocket) return;

      currentSocket.emit("remove_current_song", { roomId: roomIdRef.current });
      playNextSongRef.current(
        { roomId: roomIdRef.current },
        {
          onSuccess: () => {
            currentSocket.emit("next_song", { roomId: roomIdRef.current });
            currentSocket.emit("get_now_playing", { roomId: roomIdRef.current });
            setCurrentTime(0);
            setIsPlaying(true);
          },
        },
      );
    }, 500),
  );

  useEffect(() => {
    const handleNextSong = handleNextSongRef.current;
    return () => handleNextSong.cancel();
  }, []);

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

    if (socket && queueData?.result.nowPlaying) {
      socket.emit("video_event", {
        roomId,
        videoId: queueData.result.nowPlaying.video_id,
        event: PlaybackState.SEEK,
        currentTime: time,
      });
    }
  };

  const handleDrag = (value: number) => {
    setCurrentTime(value);
    debouncedSeekRef.current(value);
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

  const isNowPlaying = !!queueData?.result.nowPlaying;
  const displayCurrentTime = isNowPlaying ? currentTime : 0;
  const displayDuration = isNowPlaying ? duration : 0;

  useEffect(() => {
    if (!nowPlayingId && isExpanded) {
      collapse();
    }
  }, [nowPlayingId, isExpanded, collapse]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
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
      <div className="liquid-glass z-30 flex items-center justify-between gap-x-3 rounded-2xl px-3 py-1.5 text-white sm:px-4 sm:py-2">
        <div className="flex min-w-0 flex-shrink-0 items-center space-x-2 sm:space-x-3">
          {nowPlayingId ? (
            <button
              type="button"
              onClick={expand}
              className="flex min-w-0 items-center space-x-2 text-left sm:space-x-3"
              aria-label="Mở toàn màn hình bài đang phát"
            >
              <span className="relative shrink-0">
                <img
                  src={queueData.result.nowPlaying.thumbnail}
                  alt="Current Song"
                  className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/20 sm:h-11 sm:w-11"
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
              <div className="min-w-0">
                <div className="max-w-[9rem] overflow-hidden sm:max-w-[11rem] md:max-w-[14rem]">
                  <p className="animate-marquee text-xs font-bold whitespace-nowrap sm:text-sm">
                    {queueData.result.nowPlaying.title}
                  </p>
                </div>
                <p className="truncate text-[10px] text-gray-400 sm:text-xs">
                  {queueData.result.nowPlaying.author}
                </p>
              </div>
            </button>
          ) : (
            <div className="text-[10px] text-gray-400 sm:text-xs">
              Hãy tìm kiếm và thêm bài hát vào danh sách phát
            </div>
          )}
        </div>
        <div className="flex w-full min-w-0 flex-col items-center gap-y-2">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={handlePlayback}
              disabled={!nowPlayingId}
              className={`rounded-full p-1 text-white/90 transition-colors ${
                !nowPlayingId
                  ? "cursor-not-allowed opacity-40"
                  : "hover:bg-white/12"
              }`}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              onClick={() => handleNextSongRef.current()}
              disabled={
                !nowPlayingId ||
                !queueData?.result?.queue?.length ||
                isNextSongPending
              }
              className={`rounded-full p-1 text-white/90 transition-colors ${
                !nowPlayingId ||
                !queueData?.result?.queue?.length ||
                isNextSongPending
                  ? "cursor-not-allowed opacity-40"
                  : "hover:bg-white/12"
              }`}
            >
              <ForwardIcon />
              {isNextSongPending && <span className="ml-1 text-[10px]">...</span>}
            </button>
          </div>

          {isNowPlaying ? (
            <div className="flex w-full items-center space-x-2 text-xs text-gray-400">
              <span className="shrink-0 tabular-nums">
                {formatTime(displayCurrentTime)}
              </span>
              <div className="relative flex h-7 flex-1 touch-none items-center">
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/15" />
                <div
                  className="pointer-events-none absolute top-1/2 left-0 z-[5] h-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_rgba(195,10,10,0.55)] transition-all duration-75"
                  style={{
                    width: `${(displayCurrentTime / displayDuration) * 100}%`,
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={displayDuration}
                  step={0.1}
                  value={displayCurrentTime}
                  onPointerDown={handleDragStart}
                  onPointerUp={(e) =>
                    handleSeek(Number(e.currentTarget.value))
                  }
                  onPointerCancel={(e) =>
                    handleSeek(Number(e.currentTarget.value))
                  }
                  onChange={(e) => handleDrag(Number(e.target.value))}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent touch-none
                    [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-30 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/40 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(195,10,10,0.28)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150
                    [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-30 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-150
                    [&::-ms-thumb]:relative [&::-ms-thumb]:z-30 [&::-ms-thumb]:h-4 [&::-ms-thumb]:w-4 [&::-ms-thumb]:appearance-none [&::-ms-thumb]:rounded-full [&::-ms-thumb]:bg-primary [&::-ms-thumb]:transition-all [&::-ms-thumb]:duration-150"
                  style={{
                    WebkitTapHighlightColor: "transparent",
                  }}
                />
              </div>
              <span className="shrink-0 tabular-nums">
                {formatTime(displayDuration)}
              </span>
            </div>
          ) : (
            <div className="h-7 w-full" />
          )}
        </div>

        <div className="flex flex-shrink-0 items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="text-white">{renderVolumeIcon()}</div>
            <div className="relative w-20 sm:w-24">
              <div className="absolute top-1/2 left-0 h-1.5 w-full -translate-y-1/2 rounded-full bg-white/15"></div>
              <div
                className="absolute z-10 top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_rgba(195,10,10,0.5)] transition-all duration-75"
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
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/40 [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-30
                    [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-30"
              />
            </div>
          </div>
          {nowPlayingId && (
            <button
              type="button"
              onClick={expand}
              className="liquid-glass-orb flex size-10 items-center justify-center rounded-full text-white"
              aria-label="Mở toàn màn hình"
              title="Toàn màn hình"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 9V3.75H9M20.25 9V3.75H15M20.25 15v5.25H15M3.75 15v5.25H9"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      {queueData?.result.nowPlaying && (
        <NowPlayingFullscreen
          open={isExpanded}
          song={queueData.result.nowPlaying}
          currentTime={displayCurrentTime}
          duration={displayDuration}
          onClose={collapse}
        />
      )}
    </>
  );
};

export default ControlBar;
