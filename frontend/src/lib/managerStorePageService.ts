import api from "@/lib/api/axios";
import {
  applyStorePageDefaults,
  applyStorePageDefaultsList,
} from "@/lib/storePageFallback";
import type {
  StorePageDto,
  StorePageSlug,
  UpdateStorePageRequestDto,
} from "@/types/storePage";

export const ManagerStorePageService = {
  getPages: async (): Promise<StorePageDto[]> => {
    const response = await api.get("/api/manager/store/pages");
    return applyStorePageDefaultsList(response.data);
  },

  getPage: async (slug: StorePageSlug): Promise<StorePageDto> => {
    const response = await api.get(`/api/manager/store/pages/${slug}`);
    return applyStorePageDefaults(response.data);
  },

  updatePage: async (
    slug: StorePageSlug,
    data: UpdateStorePageRequestDto,
  ): Promise<StorePageDto> => {
    const response = await api.put(`/api/manager/store/pages/${slug}`, data);
    return applyStorePageDefaults(response.data);
  },
};
