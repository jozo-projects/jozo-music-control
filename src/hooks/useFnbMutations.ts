import http from "@/utils/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useFnbMutations = () => {
  const queryClient = useQueryClient();

  // Mutation để thêm món vào order (cộng dồn)
  const addToOrder = useMutation({
    mutationFn: async ({
      payload,
      roomId,
    }: {
      payload: CreateFnbOrderPayload;
      roomId: string;
    }) => {
      const response = await http.post<ApiResponse<FnbOrder>>(
        `/client/fnb/orders/room/${roomId}/add`,
        payload,
      );
      return response.data.result;
    },
    onSuccess: () => {
      // Invalidate query để refetch order mới nhất
      // Chỉ invalidate menu để cập nhật inventory, KHÔNG refetch orders để tránh sync lại cart
      queryClient.invalidateQueries({ queryKey: ["fnbMenu"] });
    },
  });

  // Mutation để giảm món khỏi order
  const removeFromOrder = useMutation({
    mutationFn: async ({
      payload,
      roomId,
    }: {
      payload: CreateFnbOrderPayload;
      roomId: string;
    }) => {
      const response = await http.post<ApiResponse<FnbOrder>>(
        `/client/fnb/orders/room/${roomId}/remove`,
        payload,
      );
      return response.data.result;
    },
    onSuccess: () => {
      // Invalidate query để refetch order mới nhất
      // Chỉ invalidate menu để cập nhật inventory, KHÔNG refetch orders để tránh sync lại cart
      queryClient.invalidateQueries({ queryKey: ["fnbMenu"] });
    },
  });

  // Mutation để ghi đè toàn bộ order (Set về số lượng cụ thể)
  const updateOrder = useMutation({
    mutationFn: async ({
      payload,
      roomId,
    }: {
      payload: CreateFnbOrderPayload;
      roomId: string;
    }) => {
      const response = await http.put<ApiResponse<FnbOrder>>(
        `/client/fnb/orders/room/${roomId}`,
        payload,
      );
      return response.data.result;
    },
    onSuccess: () => {
      // Invalidate query để refetch order mới nhất
      // Chỉ invalidate menu để cập nhật inventory, KHÔNG refetch orders để tránh sync lại cart
      queryClient.invalidateQueries({ queryKey: ["fnbMenu"] });
    },
  });

  // Mutation cũ (giữ lại để backward compatibility)
  const submitOrder = useMutation({
    mutationFn: async ({
      payload,
      roomId,
    }: {
      payload: CreateFnbOrderPayload;
      roomId: string;
    }) => {
      const response = await http.put<ApiResponse<FnbOrder>>(
        `/client/fnb/orders/room/${roomId}`,
        payload,
      );
      return response.data.result;
    },
    onSuccess: () => {
      // Chỉ invalidate menu để cập nhật inventory, KHÔNG refetch orders để tránh sync lại cart
      queryClient.invalidateQueries({ queryKey: ["fnbMenu"] });
    },
  });

  // Mutation để submit cart lên BE
  const submitCart = useMutation({
    mutationFn: async ({
      payload,
      roomId,
    }: {
      payload: {
        cart: {
          drinks: Record<string, number>;
          snacks: Record<string, number>;
        };
      };
      roomId: string;
    }) => {
      const response = await http.post<ApiResponse<FnbOrder>>(
        `/client/fnb/orders/room/${roomId}/submit-cart`,
        payload,
      );
      return response.data.result;
    },
    onSuccess: (_, variables) => {
      // Invalid queries sau khi submit cart
      queryClient.invalidateQueries({
        queryKey: ["fnb-orders", variables.roomId],
      });
      queryClient.invalidateQueries({ queryKey: ["fnbMenu"] });
    },
  });

  return {
    addToOrder,
    removeFromOrder,
    updateOrder,
    submitOrder, // Giữ lại để backward compatibility
    submitCart, // API mới để submit cart
  };
};
