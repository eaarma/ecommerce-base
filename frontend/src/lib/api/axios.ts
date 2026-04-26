import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";
import toast from "react-hot-toast";

import { store } from "@/store/store";
import { clearAuth } from "@/store/authSlice";

const NETWORK_ERROR_TOAST_ID = "network-error";

export interface ApiErrorData {
  message?: string;
  error?: string;
  status?: number;
  timestamp?: string;
  path?: string;
}

export class ApiError extends Error {
  status: number;
  data?: ApiErrorData | unknown;

  constructor(status: number, data?: ApiErrorData | unknown) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : "Request failed";

    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!baseURL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
}

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

//  REQUEST INTERCEPTOR attach Authorization header from Redux auth state

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const headers = AxiosHeaders.from(config.headers);

    const accessToken =
      store.getState().auth.accessToken ??
      (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    config.headers = headers;
    return config;
  },
  (error) => Promise.reject(error),
);

//RESPONSE INTERCEPTOR handle network + API errors

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const { response } = error;

    if (!response) {
      toast.error("Network error. Please check your connection.", {
        id: NETWORK_ERROR_TOAST_ID,
      });
      return Promise.reject(new ApiError(0, { message: "Network error" }));
    }

    const status = response.status;
    const data = response.data;

    if (status === 401) {
      store.dispatch(clearAuth());
    }

    switch (status) {
      case 400: {
        const message =
          typeof data === "object" &&
          data !== null &&
          "message" in data &&
          typeof (data as { message?: unknown }).message === "string"
            ? (data as { message: string }).message
            : "Bad request.";

        toast.error(message);
        break;
      }

      case 401:
        toast.error("Unauthorized. Please log in again.");
        break;

      case 403:
        toast.error("You do not have permission to do that.");
        break;

      case 404:
        toast.error("Resource not found.");
        break;

      case 500:
        toast.error("Server error. Please try again later.");
        break;

      default:
        toast.error("Unexpected error occurred.");
        break;
    }

    return Promise.reject(new ApiError(status, data));
  },
);

export default api;
