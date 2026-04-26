import api from "@/lib/api/axios";
import {
  CreateProductRequestDto,
  ProductDto,
  UpdateProductRequestDto,
} from "@/types/product";

export const ManagerProductService = {
  getAllProducts: async (): Promise<ProductDto[]> => {
    const res = await api.get("/api/manager/products");
    return res.data;
  },

  createProduct: async (
    data: CreateProductRequestDto,
  ): Promise<ProductDto> => {
    const res = await api.post("/api/manager/products", data);
    return res.data;
  },

  updateProduct: async (
    id: number,
    data: UpdateProductRequestDto,
  ): Promise<ProductDto> => {
    const res = await api.put(`/api/manager/products/${id}`, data);
    return res.data;
  },
};
