import api from "@/lib/api/axios";
import type {
  CreateProductImageRecordRequestDto,
  ProductImageDto,
} from "@/types/product";

export const ManagerProductImageService = {
  createProductImage: async (
    productId: number,
    data: CreateProductImageRecordRequestDto,
  ): Promise<ProductImageDto> => {
    const res = await api.post(`/api/manager/products/${productId}/images`, data);
    return res.data;
  },
};
