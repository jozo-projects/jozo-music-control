import http from "@/utils/http";
import { useQuery } from "@tanstack/react-query";

export const useGiftListQuery = () => {
  return useQuery({
    queryKey: ["gifts"],
    queryFn: async () => {
      const response = await http.get<ApiResponse<Gift[]>>("/gifts/public");
      return response.data.result;
    },
  });
};

