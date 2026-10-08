import SongCard from "@/components/SongCard";
import { useRoomAccessEnabled } from "@/hooks/useRoomAccessEnabled";
import { searchLocalSongs, searchRemoteSongs } from "@/services/searchService";
import { useQueries } from "@tanstack/react-query";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import debounce from "lodash/debounce";
import { buildSearchQuery } from "./searchQuery";
import { mergeSearchResults } from "./mergeSearchResults";

// Skeleton Card Component
const SkeletonCard: React.FC = () => (
  <div className="liquid-glass-card animate-pulse overflow-hidden rounded-2xl">
    <div className="h-40 w-full bg-white/10" />
    <div className="border-t border-white/10 px-3 py-2.5">
      <div className="mb-2 space-y-2">
        <div className="h-4 w-full rounded bg-white/15" />
        <div className="h-4 w-3/4 rounded bg-white/10" />
      </div>
      <div className="h-3 w-1/2 rounded bg-white/10" />
    </div>
  </div>
);

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const karaoke = searchParams.get("karaoke") !== "false";
  const isRoomAccessEnabled = useRoomAccessEnabled();

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

    return () => {
      debouncedSearch.cancel();
    };
  }, [query]);

  // Chọn loại video theo chế độ; không thêm hashtag vào query.
  const searchQuery = useMemo(
    () => buildSearchQuery(processedQuery, karaoke),
    [processedQuery, karaoke],
  );

  // Parallel queries — giữ placeholderData để tránh nhấp nháy khi đổi query
  const queries = useQueries({
    queries: [
      {
        queryKey: ["searchLocal", searchQuery.toLowerCase().trim()],
        queryFn: () => searchLocalSongs(searchQuery),
        enabled:
          isRoomAccessEnabled && shouldSearch && processedQuery.length >= 2,
        staleTime: 1000 * 60 * 5,
        retry: 2,
        placeholderData: (prev: Video[] | undefined) => prev,
      },
      {
        queryKey: ["searchRemote", searchQuery.toLowerCase().trim()],
        queryFn: () => searchRemoteSongs(searchQuery),
        enabled:
          isRoomAccessEnabled && shouldSearch && processedQuery.length >= 2,
        staleTime: 1000 * 60 * 5,
        retry: 2,
        placeholderData: (prev: Video[] | undefined) => prev,
      },
    ],
  });

  // Destructure results từ array queries
  const [localQuery, remoteQuery] = queries;
  const isLocalLoading = localQuery.isLoading;
  const isLocalError = localQuery.isError;
  const isRemoteLoading = remoteQuery.isLoading;
  const isRemoteError = remoteQuery.isError;

  // Hiển thị local ngay; khi remote về thì gộp theo độ khớp, giữ local nếu trùng ID.
  const combinedResults = useMemo(() => {
    const localResults = (localQuery.data as Video[]) || [];
    const remoteResults = (remoteQuery.data as Video[]) || [];
    return mergeSearchResults(localResults, remoteResults, searchQuery);
  }, [localQuery.data, remoteQuery.data, searchQuery]);

  // Loading state: chỉ hiển thị loading khi local đang loading
  // (vì local nhanh, nên nếu local xong thì hiển thị ngay, không cần đợi remote)
  const isLoading = isLocalLoading;

  // Error state: có lỗi nếu cả 2 đều fail (nếu chỉ 1 fail thì vẫn OK)
  const isError = isLocalError && isRemoteError;

  return (
    <div className="pointer-events-auto relative p-4 space-y-6">
      <h2 className="text-xl font-bold">Kết quả tìm kiếm</h2>

      {/* Loading State - Skeleton Cards */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <p className="text-red-500">Có lỗi xảy ra khi tải kết quả tìm kiếm.</p>
      )}

      {/* Search Results - Hiển thị ngay khi có local results, không cần đợi remote */}
      {/* Skeleton cards nối tiếp với results trong cùng grid khi remote đang loading */}
      {!isLocalLoading && combinedResults.length > 0 && (
        <div className="grid grid-cols-2 gap-4 touch-manipulation lg:grid-cols-3">
          {/* Results từ local/remote */}
          {combinedResults?.map((result: Video) => (
            <SongCard key={result.video_id} {...result} />
          ))}
          {/* Skeleton cards nối tiếp khi remote đang loading */}
          {isRemoteLoading &&
            [...Array(5)].map((_, index) => (
              <SkeletonCard key={`remote-skeleton-${index}`} />
            ))}
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
