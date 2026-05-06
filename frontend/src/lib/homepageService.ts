import {
  DEFAULT_HOMEPAGE_CONFIG,
  HomepageConfigPublicDto,
} from "@/types/homepage";

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

export const HomepageService = {
  getPublicHomepageConfig: async (): Promise<HomepageConfigPublicDto> => {
    const response = await fetch(new URL("/api/store/homepage", baseURL), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw createRequestError(
        "Failed to load homepage configuration",
        response.status,
      );
    }

    return response.json();
  },
};

export async function getPublicHomepageConfigOrFallback(): Promise<HomepageConfigPublicDto> {
  try {
    return await HomepageService.getPublicHomepageConfig();
  } catch {
    return DEFAULT_HOMEPAGE_CONFIG;
  }
}
