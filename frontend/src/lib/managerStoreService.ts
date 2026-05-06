import api from "@/lib/api/axios";
import type { ManagerShopDto, UpdateShopRequestDto } from "@/types/shop";

export const ManagerStoreService = {
  getShop: async (): Promise<ManagerShopDto> => {
    const response = await api.get("/api/manager/store/shop");
    return response.data;
  },

  updateShop: async (
    data: UpdateShopRequestDto,
  ): Promise<ManagerShopDto> => {
    const response = await api.put("/api/manager/store/shop", data);
    return response.data;
  },
};
