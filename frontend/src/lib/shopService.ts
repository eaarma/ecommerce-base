import { DEFAULT_PUBLIC_SHOP, ShopPublicDto } from "@/types/shop";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!baseURL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
}

type ApiRequestError = Error & {
  status: number;
};

const createRequestError = (
  message: string,
  status: number,
): ApiRequestError => {
  const error = new Error(`${message}: ${status}`) as ApiRequestError;
  error.status = status;
  return error;
};

export const ShopService = {
  getPublicShop: async (): Promise<ShopPublicDto> => {
    const response = await fetch(new URL("/api/store/shop", baseURL), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw createRequestError("Failed to load store profile", response.status);
    }

    return response.json();
  },
};

export async function getPublicShopOrFallback(): Promise<ShopPublicDto> {
  try {
    return await ShopService.getPublicShop();
  } catch {
    return DEFAULT_PUBLIC_SHOP;
  }
}
