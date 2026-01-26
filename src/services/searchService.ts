import axiosInstance from "@/utils/http";

/**
 * Normalize video data
 */
const normalizeVideos = (
  items: Video[] = [],
  sourceFallback: string,
): Video[] =>
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
  }));

/**
 * Tìm kiếm bài hát trong DB (local)
 * @param query - Từ khóa tìm kiếm
 * @param limit - Số lượng kết quả trả về (mặc định: 50)
 * @returns Danh sách các video tìm thấy trong DB
 */
export const searchLocalSongs = async (
  query: string,
  limit: number = 50,
): Promise<Video[]> => {
  if (!query) return [];

  try {
    const response = await axiosInstance.get<
      ApiResponse<{
        songs: Video[];
        source: string;
        cached: boolean;
        duration: number;
      }>
    >(`/room-music/search-songs/local`, {
      params: {
        q: query,
        limit,
      },
    });

    const payload = response?.data?.result;

    if (!payload || !Array.isArray(payload.songs)) {
      return [];
    }

    return normalizeVideos(payload.songs, "local");
  } catch (error) {
    console.error("Error in searchLocalSongs:", error);
    // Trả về mảng rỗng thay vì throw để không làm fail toàn bộ search
    return [];
  }
};

/**
 * Tìm kiếm bài hát trên YouTube (remote)
 * @param query - Từ khóa tìm kiếm
 * @param limit - Số lượng kết quả trả về (mặc định: 50)
 * @returns Danh sách các video tìm thấy trên YouTube
 */
export const searchRemoteSongs = async (
  query: string,
  limit: number = 50,
): Promise<Video[]> => {
  if (!query) return [];

  try {
    const response = await axiosInstance.get<
      ApiResponse<{
        songs: Video[];
        source: string;
        cached: boolean;
        duration: number;
      }>
    >(`/room-music/search-songs/remote`, {
      params: {
        q: query,
        limit,
      },
    });

    const payload = response?.data?.result;

    if (!payload || !Array.isArray(payload.songs)) {
      return [];
    }

    return normalizeVideos(payload.songs, "yt");
  } catch (error) {
    console.error("Error in searchRemoteSongs:", error);
    // Trả về mảng rỗng thay vì throw để không làm fail toàn bộ search
    return [];
  }
};

/**
 * @deprecated Sử dụng searchLocalSongs và searchRemoteSongs riêng biệt
 * Interface cũ để tương thích ngược (nếu cần)
 */
export interface SearchSongsResponse {
  requestId: string;
  local: Video[];
  remote_pending: boolean;
  remote: Video[];
}
