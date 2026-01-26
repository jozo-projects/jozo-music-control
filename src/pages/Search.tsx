/* eslint-disable @typescript-eslint/no-explicit-any */
import SongCard from "@/components/SongCard";
import { useSocket } from "@/contexts/SocketContext";
import { searchSongs, SearchSongsResponse } from "@/services/searchService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import debounce from "lodash/debounce";

// Helper function to detect mobile/tablet devices
const isMobileOrTablet = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/g.test(
    userAgent,
  );
  return isMobile;
};

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const karaoke = searchParams.get("karaoke") === "true";
  const roomId = searchParams.get("roomId") || "";
  const location = useLocation();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // State để kiểm soát khi nào thực hiện tìm kiếm
  const [shouldSearch, setShouldSearch] = useState(false);
  // Lưu trữ query đã được xử lý (loại bỏ khoảng trắng ở cuối)
  const [processedQuery, setProcessedQuery] = useState("");
  const [localResults, setLocalResults] = useState<Video[]>([]);
  const [remoteResults, setRemoteResults] = useState<Video[]>([]);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  // Lưu mapping giữa requestId và queryKey để update cache đúng
  const [requestIdToQueryKey, setRequestIdToQueryKey] = useState<
    Map<string, any[]>
  >(new Map());

  // Tạo hàm debounce để tránh gọi API quá nhiều lần
  const debouncedSearch = useCallback(
    debounce((trimmedQuery: string) => {
      setProcessedQuery(trimmedQuery);
      setShouldSearch(true);
    }, 1000),
    [],
  );

  const normalizeVideos = useCallback(
    (items: Video[] = [], sourceFallback = "yt") =>
      items.map((item: Video) => ({
        video_id: item.video_id,
        title: item.title,
        thumbnail: item.thumbnail || "",
        author: item.author || "Unknown Artist",
        duration: item.duration ?? 0,
        url: item.url || `https://youtube.com/watch?v=${item.video_id}`,
        source: item.source || sourceFallback,
        is_saved: item.is_saved ?? true,
        match_score: item.match_score,
      })),
    [],
  );

  type SearchSongsCompletedPayload = {
    requestId: string;
    source: string;
    remote: Video[];
    status: "ok" | "error" | "timeout" | string;
  };

  // Theo dõi thay đổi URL để kích hoạt tìm kiếm khi người dùng nhập
  useEffect(() => {
    if (query.length >= 2) {
      const trimmedQuery = query.trimEnd();
      debouncedSearch(trimmedQuery);
    } else {
      setProcessedQuery("");
      setShouldSearch(false);
    }

    // Enhanced keyboard handling for mobile devices
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && isMobileOrTablet()) {
        e.preventDefault();
        // Blur any focused input element
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        // For iOS devices, we can try to force the keyboard to close
        // by temporarily making the input readonly
        const activeInput = document.activeElement as HTMLInputElement;
        if (activeInput?.tagName === "INPUT") {
          activeInput.setAttribute("readonly", "readonly");
          setTimeout(() => {
            activeInput.removeAttribute("readonly");
          }, 100);
        }
      }
    };

    // Handle form submission on mobile
    const handleFormSubmit = (e: Event) => {
      if (isMobileOrTablet()) {
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("submit", handleFormSubmit);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("submit", handleFormSubmit);
      debouncedSearch.cancel();
    };
  }, [location.search, query, debouncedSearch]);

  // Query key để dùng cho cache update
  const queryKey = useMemo(
    () => [
      "searchResults",
      processedQuery.toLowerCase().trim(),
      karaoke,
      roomId,
    ],
    [processedQuery, karaoke, roomId],
  );

  // Query cho search results
  const {
    data: searchData,
    isLoading,
    isError,
  } = useQuery<SearchSongsResponse>({
    queryKey,
    queryFn: () => {
      const normalizedQuery = processedQuery.toLowerCase().trim();
      const isEnglishQuery = /^[a-zA-Z\s]+$/.test(normalizedQuery);
      const musicKeywords = isEnglishQuery
        ? `${normalizedQuery} ${
            karaoke ? "karaoke beat #song #music" : "song #music"
          }`
        : `${normalizedQuery} ${
            karaoke ? "nhạc beat #karaoke" : "bài hát nhạc #hat #music #nhac"
          }`;
      return searchSongs(musicKeywords, roomId || "");
    },
    enabled: shouldSearch && processedQuery.length >= 2 && !!roomId,
    staleTime: 1000 * 60 * 5,
  });

  // Sync data từ query vào state
  useEffect(() => {
    if (searchData) {
      const requestId = searchData.requestId || null;
      setCurrentRequestId(requestId);

      // Lưu mapping giữa requestId và queryKey hiện tại
      if (requestId) {
        setRequestIdToQueryKey((prev) => {
          const newMap = new Map(prev);
          newMap.set(requestId, queryKey);
          return newMap;
        });
      }

      // Dữ liệu đã được normalize trong searchService rồi, không cần normalize lại
      const remoteData = searchData.remote || [];
      console.log("[Search] Remote data from API:", {
        requestId,
        queryKey,
        remoteCount: remoteData.length,
        remote: remoteData,
        remote_pending: searchData.remote_pending,
      });

      setLocalResults(searchData.local || []);
      setRemoteResults(remoteData);
      setRemoteLoading(Boolean(searchData.remote_pending));
    } else if (!shouldSearch || processedQuery.length < 2) {
      // Reset state khi không search
      setLocalResults([]);
      setRemoteResults([]);
      setCurrentRequestId(null);
      setRemoteLoading(false);
      // Cleanup mapping cũ khi không search nữa
      setRequestIdToQueryKey(new Map());
    }
  }, [searchData, shouldSearch, processedQuery, queryKey]);

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleSearchCompleted = (payload: SearchSongsCompletedPayload) => {
      if (!payload?.requestId) return;

      // Lấy queryKey tương ứng với requestId này
      const targetQueryKey = requestIdToQueryKey.get(payload.requestId);
      if (!targetQueryKey) {
        // Không tìm thấy queryKey tương ứng, bỏ qua
        return;
      }

      // Chỉ update state nếu đây là request hiện tại
      if (payload.requestId === currentRequestId) {
        // Normalize remote data
        const normalizedRemote = normalizeVideos(payload.remote || [], "yt");

        console.log("[Search] Remote data from Socket:", {
          requestId: payload.requestId,
          currentRequestId,
          targetQueryKey,
          remoteCount: normalizedRemote.length,
          remote: normalizedRemote,
          status: payload.status,
        });

        // Update state
        setRemoteResults(normalizedRemote);
        setRemoteLoading(false);
      }

      // Update cache của React Query với đúng queryKey tương ứng với requestId
      queryClient.setQueryData<SearchSongsResponse>(
        targetQueryKey,
        (oldData) => {
          if (!oldData) return oldData;

          // Normalize remote data cho cache
          const normalizedRemote = normalizeVideos(payload.remote || [], "yt");

          return {
            ...oldData,
            remote: normalizedRemote,
            remote_pending: false,
          };
        },
      );
    };

    socket.on("search_songs_completed", handleSearchCompleted);

    return () => {
      socket.off("search_songs_completed", handleSearchCompleted);
    };
  }, [
    socket,
    roomId,
    currentRequestId,
    normalizeVideos,
    queryClient,
    requestIdToQueryKey,
  ]);

  const combinedResults = useMemo(() => {
    // Tạo Set chứa các video_id từ local để check trùng lặp
    const localVideoIds = new Set(localResults.map((video) => video.video_id));

    // Log remote trước khi merge
    console.log("[Search] Before merge:", {
      localCount: localResults.length,
      remoteCount: remoteResults.length,
      localVideoIds: Array.from(localVideoIds),
      remoteVideoIds: remoteResults.map((v) => v.video_id),
    });

    // Filter remote để loại bỏ các video_id đã có trong local
    const uniqueRemoteResults = remoteResults.filter(
      (video) => !localVideoIds.has(video.video_id),
    );

    console.log("[Search] After filter duplicates:", {
      uniqueRemoteCount: uniqueRemoteResults.length,
      filteredOutCount: remoteResults.length - uniqueRemoteResults.length,
      uniqueRemoteVideoIds: uniqueRemoteResults.map((v) => v.video_id),
    });

    // Merge local với remote đã được filter
    const merged = [...localResults, ...uniqueRemoteResults];

    console.log("[Search] Final merged results:", {
      totalCount: merged.length,
      localCount: localResults.length,
      remoteCount: uniqueRemoteResults.length,
    });

    return merged;
  }, [localResults, remoteResults]);

  return (
    <div className="p-4 space-y-6 relative">
      <h2 className="text-xl font-bold">Kết quả tìm kiếm</h2>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <p className="text-xl text-primary font-semibold animate-bounce-slow">
            🎵
            <span className="inline-block animate-pulse text-lightpink">
              Jozo đang tìm kiếm bài hát cho tình yêu...
            </span>
            <span className="inline-block animate-spin-slow">💝</span>
          </p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <p className="text-red-500">Có lỗi xảy ra khi tải kết quả tìm kiếm.</p>
      )}

      {/* Search Results */}
      {!isLoading && combinedResults.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {combinedResults?.map((result: Video) => (
            <SongCard key={result.video_id} {...result} />
          ))}
        </div>
      )}

      {/* Remote loading */}
      {remoteLoading && !isLoading && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="italic">Đang tìm thêm...</span>
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading &&
        !remoteLoading &&
        combinedResults.length === 0 &&
        processedQuery &&
        shouldSearch && (
          <p className="text-gray-500">Không có kết quả phù hợp.</p>
        )}

      {/* Instruction for user */}
      {query.length < 2 && (
        <p className="text-gray-500">
          Nhập ít nhất 2 ký tự để tìm kiếm bài hát.
        </p>
      )}
    </div>
  );
};

export default SearchPage;
