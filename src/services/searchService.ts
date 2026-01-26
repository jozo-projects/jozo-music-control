import axiosInstance from "@/utils/http";

/**
 * Hàm tìm kiếm bài hát
 * @param query - Từ khóa tìm kiếm
 * @param limit - Số lượng kết quả trả về (mặc định: 50)
 * @returns Danh sách các video tìm thấy
 */
export interface SearchSongsResponse {
  requestId: string;
  local: Video[];
  remote_pending: boolean;
  remote: Video[];
}

const normalizeVideos = (items: Video[] = [], sourceFallback: string): Video[] =>
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

export const searchSongs = async (
  query: string,
  roomId: string,
  limit: number = 50
): Promise<SearchSongsResponse> => {
  if (!query)
    return {
      requestId: "",
      local: [],
      remote_pending: false,
      remote: [],
    };

  try {
    const response = await axiosInstance.get<
      ApiResponse<{
        requestId: string;
        local: Video[];
        remote_pending: boolean;
        remote: Video[];
      }>
    >(
      `/room-music/${roomId}/search-songs`,
      {
        params: {
          q: query, // Từ khóa tìm kiếm
          limit, // Giới hạn kết quả
        },
      }
    );

    const payload = response?.data?.result;

    if (!payload) {
      return {
        requestId: "",
        local: [],
        remote_pending: false,
        remote: [],
      };
    }

    return {
      requestId: payload.requestId,
      local: normalizeVideos(payload.local, "local"),
      remote_pending: Boolean(payload.remote_pending),
      remote: normalizeVideos(payload.remote, "yt"),
    };
  } catch (error) {
    console.error("Error in searchSongs:", error);
    throw error; // Cho phép React Query hoặc caller xử lý lỗi
  }
};
