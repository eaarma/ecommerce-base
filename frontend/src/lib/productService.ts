import { PageResponse, ProductDto, ProductPageQuery } from "@/types/product";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";

const baseURL = getApiBaseUrl();

type ApiRequestError = Error & {
  status: number;
};

const createRequestError = (message: string, status: number): ApiRequestError => {
  const error = new Error(`${message}: ${status}`) as ApiRequestError;
  error.status = status;
  return error;
};

export const ProductService = {
  getAllProducts: async (): Promise<ProductDto[]> => {
    const response = await fetch(new URL("/api/products", baseURL), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw createRequestError("Failed to load products", response.status);
    }

    return response.json();
  },

  getProductsPage: async (
    query: ProductPageQuery,
  ): Promise<PageResponse<ProductDto>> => {
    const url = new URL("/api/products", baseURL);

    if (typeof query.page === "number") {
      url.searchParams.set("page", query.page.toString());
    }

    if (typeof query.size === "number") {
      url.searchParams.set("size", query.size.toString());
    }

    if (query.sort) {
      url.searchParams.set("sort", query.sort);
    }

    query.availability?.forEach((value) => {
      url.searchParams.append("availability", value);
    });

    query.priceRange?.forEach((value) => {
      url.searchParams.append("priceRange", value);
    });

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw createRequestError("Failed to load products", response.status);
    }

    return response.json();
  },

  getProductById: async (id: number): Promise<ProductDto> => {
    const response = await fetch(new URL(`/api/products/${id}`, baseURL), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw createRequestError("Failed to load product", response.status);
    }

    return response.json();
  },
};
