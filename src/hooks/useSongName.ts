import { useRoomAccessEnabled } from "@/hooks/useRoomAccessEnabled";
import { useQuery } from "@tanstack/react-query";
import http from "@/utils/http";
import { useSearchParams } from "react-router-dom";
import { mergeSongSuggestions } from "./mergeSongSuggestions";

interface UseSongNameOptions {
  enabled?: boolean;
  karaoke?: boolean;
}

export const useSongName = (query: string, options?: UseSongNameOptions) => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");
  const karaoke = options?.karaoke ?? (searchParams.get("karaoke") === "true");
  const isRoomAccessEnabled = useRoomAccessEnabled();
  const keyword = query.trim();
  const enabled = isRoomAccessEnabled && !!options?.enabled && !!roomId && keyword.length >= 2;

  // Independent requests let the local catalog paint before the slower remote provider responds.
  const local = useQuery({
    queryKey: ["songName", "local", keyword, karaoke, roomId],
    queryFn: async () => {
      const response = await http.get<ApiResponse<string[]>>(
        `/room-music/${roomId}/autocomplete/local`, { params: { keyword, isKaraoke: karaoke } },
      );
      return response.data.result;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const remote = useQuery({
    queryKey: ["songName", "remote", keyword, karaoke, roomId],
    queryFn: async () => {
      const response = await http.get<ApiResponse<string[]>>(
        `/room-music/${roomId}/autocomplete`,
        { params: { keyword, isKaraoke: karaoke } },
      );
      return response.data.result;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return { data: mergeSongSuggestions(local.data, remote.data, karaoke, keyword) };
};
