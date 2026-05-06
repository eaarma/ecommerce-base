import api from "@/lib/api/axios";
import type {
  HomepageConfigDto,
  UpdateHomepageConfigRequestDto,
} from "@/types/homepage";

export const ManagerHomepageService = {
  getHomepageConfig: async (): Promise<HomepageConfigDto> => {
    const response = await api.get("/api/manager/store/homepage");
    return response.data;
  },

  updateHomepageConfig: async (
    data: UpdateHomepageConfigRequestDto,
  ): Promise<HomepageConfigDto> => {
    const response = await api.put("/api/manager/store/homepage", data);
    return response.data;
  },
};
