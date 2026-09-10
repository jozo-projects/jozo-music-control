import http from "@/utils/http";
import {
  normalizePublicCategorySong,
  type PublicCategorySongDto,
} from "@/utils/songNormalization";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

const MUSIC_CATEGORY_STALE_TIME_MS = 5 * 60_000;
const MUSIC_CATEGORY_SONGS_PAGE_SIZE = 50;

type MusicCategorySongsApiResult = Omit<MusicCategorySongsResult, "songs"> & {
  songs: PublicCategorySongDto[];
};

export const useMusicCategoriesQuery = () =>
  useQuery({
    queryKey: ["musicCategories"],
    queryFn: async ({ signal }) => {
      const response = await http.get<ApiResponse<MusicCategory[]>>(
        "/room-music/music-categories",
        { signal, skipErrorToast: true },
      );

      return response.data.result;
    },
    staleTime: MUSIC_CATEGORY_STALE_TIME_MS,
    refetchOnMount: "always",
  });

export const useMusicCategorySongsQuery = (categoryId: string | null) =>
  useInfiniteQuery({
    queryKey: ["musicCategorySongs", categoryId],
    queryFn: async ({ pageParam, signal }) => {
      const response = await http.get<ApiResponse<MusicCategorySongsApiResult>>(
        `/room-music/music-categories/${categoryId}/songs`,
        {
          params: { page: pageParam, limit: MUSIC_CATEGORY_SONGS_PAGE_SIZE },
          signal,
          skipErrorToast: true,
        },
      );

      return {
        ...response.data.result,
        songs: response.data.result.songs.map(normalizePublicCategorySong),
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined,
    enabled: Boolean(categoryId),
    staleTime: MUSIC_CATEGORY_STALE_TIME_MS,
    refetchOnMount: "always",
  });
