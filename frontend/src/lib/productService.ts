import { ProductDto } from "@/types/product";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!baseURL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
}

export const ProductService = {
  getAllProducts: async (): Promise<ProductDto[]> => {
    const response = await fetch(new URL("/api/products", baseURL), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to load products: ${response.status}`);
    }

    return response.json();
  },

  getProductById: async (id: number): Promise<ProductDto> => {
    const response = await fetch(new URL(`/api/products/${id}`, baseURL), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to load product: ${response.status}`);
    }

    return response.json();
  },
};
