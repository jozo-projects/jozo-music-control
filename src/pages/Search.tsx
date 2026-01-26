import SongCard from "@/components/SongCard";
import { searchLocalSongs, searchRemoteSongs } from "@/services/searchService";
import { useQueries } from "@tanstack/react-query";
import React, { useEffect, useState, useMemo, useRef } from "react";
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
  const location = useLocation();

  // State để kiểm soát khi nào thực hiện tìm kiếm
  const [shouldSearch, setShouldSearch] = useState(false);
  // Lưu trữ query đã được xử lý (loại bỏ khoảng trắng ở cuối)
  const [processedQuery, setProcessedQuery] = useState("");

  // Tạo hàm debounce để tránh gọi API quá nhiều lần
  const debouncedSearchRef = useRef(
    debounce((trimmedQuery: string) => {
      setProcessedQuery(trimmedQuery);
      setShouldSearch(true);
    }, 1000),
  );

  // Theo dõi thay đổi URL để kích hoạt tìm kiếm khi người dùng nhập
  useEffect(() => {
    const debouncedSearch = debouncedSearchRef.current;

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
  }, [location.search, query]);

  // Tạo search query với keywords phù hợp
  const searchQuery = useMemo(() => {
    if (!processedQuery) return "";
    const normalizedQuery = processedQuery.toLowerCase().trim();
    const isEnglishQuery = /^[a-zA-Z\s]+$/.test(normalizedQuery);
    return isEnglishQuery
      ? `${normalizedQuery} ${
          karaoke ? "karaoke beat #song #music" : "song #music"
        }`
      : `${normalizedQuery} ${
          karaoke ? "nhạc beat #karaoke" : "bài hát nhạc #hat #music #nhac"
        }`;
  }, [processedQuery, karaoke]);

  // Parallel queries sử dụng useQueries - chạy song song cả 2 API
  const queries = useQueries({
    queries: [
      {
        queryKey: ["searchLocal", searchQuery.toLowerCase().trim()],
        queryFn: () => searchLocalSongs(searchQuery),
        enabled: shouldSearch && processedQuery.length >= 2,
        staleTime: 1000 * 60 * 5, // Cache 5 phút
        retry: 2, // Retry 2 lần nếu fail
      },
      {
        queryKey: ["searchRemote", searchQuery.toLowerCase().trim()],
        queryFn: () => searchRemoteSongs(searchQuery),
        enabled: shouldSearch && processedQuery.length >= 2,
        staleTime: 1000 * 60 * 5, // Cache 5 phút (Redis cache ở backend)
        retry: 2, // Retry 2 lần nếu fail
      },
    ],
  });

  // Destructure results từ array queries
  const [localQuery, remoteQuery] = queries;
  const isLocalLoading = localQuery.isLoading;
  const isLocalError = localQuery.isError;
  const isRemoteLoading = remoteQuery.isLoading;
  const isRemoteError = remoteQuery.isError;

  // Combine results: local + remote (loại bỏ trùng lặp)
  // Hiển thị local ngay khi có, không cần đợi remote
  const combinedResults = useMemo(() => {
    const localResults = (localQuery.data as Video[]) || [];
    const remoteResults = (remoteQuery.data as Video[]) || [];

    // Nếu chưa có local results, trả về remote (nếu có)
    if (localResults.length === 0) {
      return remoteResults;
    }

    // Tạo Set chứa các video_id từ local để check trùng lặp
    const localVideoIds = new Set(localResults.map((video) => video.video_id));

    // Filter remote để loại bỏ các video_id đã có trong local
    const uniqueRemoteResults = remoteResults.filter(
      (video) => !localVideoIds.has(video.video_id),
    );

    // Merge local với remote đã được filter (local trước, remote sau)
    return [...localResults, ...uniqueRemoteResults];
  }, [localQuery.data, remoteQuery.data]);

  // Loading state: chỉ hiển thị loading khi local đang loading
  // (vì local nhanh, nên nếu local xong thì hiển thị ngay, không cần đợi remote)
  const isLoading = isLocalLoading;

  // Error state: có lỗi nếu cả 2 đều fail (nếu chỉ 1 fail thì vẫn OK)
  const isError = isLocalError && isRemoteError;

  return (
    <div className="p-4 space-y-6 relative">
      <h2 className="text-xl font-bold">Kết quả tìm kiếm</h2>

      {/* Loading State - Skeleton Cards */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="shadow-md rounded-lg overflow-hidden animate-pulse"
            >
              {/* Image skeleton */}
              <div className="w-full h-40 bg-gray-300 dark:bg-gray-700"></div>
              {/* Content skeleton */}
              <div className="p-4 bg-black/60">
                {/* Title skeleton - 2 lines */}
                <div className="mb-2 space-y-2">
                  <div className="h-4 bg-gray-400 dark:bg-gray-600 rounded w-full"></div>
                  <div className="h-4 bg-gray-400 dark:bg-gray-600 rounded w-3/4"></div>
                </div>
                {/* Author skeleton */}
                <div className="h-3 bg-gray-400 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <p className="text-red-500">Có lỗi xảy ra khi tải kết quả tìm kiếm.</p>
      )}

      {/* Search Results - Hiển thị ngay khi có local results, không cần đợi remote */}
      {!isLocalLoading && combinedResults.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {combinedResults?.map((result: Video) => (
            <SongCard key={result.video_id} {...result} />
          ))}
        </div>
      )}

      {/* Remote loading indicator - Hiển thị khi remote đang load nhưng local đã xong */}
      {isRemoteLoading && !isLocalLoading && combinedResults.length > 0 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="italic">Đang tìm thêm video</span>
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLocalLoading &&
        !isRemoteLoading &&
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
