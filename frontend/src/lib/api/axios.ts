import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";
import toast from "react-hot-toast";

import { store } from "@/store/store";
import { clearAuth } from "@/store/authSlice";
import {
  getStoredAccessToken,
  getStoredAuthUser,
  handleExpiredSession,
  isJwtExpired,
  isStaffRole,
} from "@/lib/authSession";

const NETWORK_ERROR_TOAST_ID = "network-error";
const MANAGER_API_PREFIX = "/api/manager";

export interface ApiErrorData {
  message?: string;
  messages?: string[];
  error?: string;
  status?: number;
  timestamp?: string;
  path?: string;
}

function getApiErrorMessage(data?: ApiErrorData | unknown): string {
  if (typeof data !== "object" || data === null) {
    return "Request failed";
  }

  if ("message" in data && typeof data.message === "string") {
    return data.message;
  }

  if (
    "messages" in data &&
    Array.isArray(data.messages) &&
    typeof data.messages[0] === "string"
  ) {
    return data.messages[0];
  }

  if ("error" in data && typeof data.error === "string") {
    return data.error;
  }

  return "Request failed";
}

export class ApiError extends Error {
  status: number;
  data?: ApiErrorData | unknown;

  constructor(status: number, data?: ApiErrorData | unknown) {
    super(getApiErrorMessage(data));
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
      store.getState().auth.accessToken ?? getStoredAccessToken();

    if (accessToken) {
      if (isJwtExpired(accessToken)) {
        handleExpiredSession();
        return Promise.reject(
          new ApiError(401, { message: "Session is expired" }),
        );
      }

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
    const authState = store.getState().auth;
    const accessToken = authState.accessToken ?? getStoredAccessToken();
    const user = authState.user ?? getStoredAuthUser();
    const requestUrl = error.config?.url ?? "";
    const isManagerRequest = requestUrl.startsWith(MANAGER_API_PREFIX);

    if (status === 401 && accessToken) {
      handleExpiredSession();
      return Promise.reject(new ApiError(status, data));
    }

    if (
      status === 403 &&
      isManagerRequest &&
      accessToken &&
      isStaffRole(user?.role)
    ) {
      handleExpiredSession();
      return Promise.reject(new ApiError(status, data));
    }

    if (status === 401) {
      store.dispatch(clearAuth());
    }

    switch (status) {
      case 400: {
        toast.error(getApiErrorMessage(data as ApiErrorData | unknown));
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

      case 409:
        toast.error(getApiErrorMessage(data as ApiErrorData | unknown));
        break;

      case 500:
        toast.error("Server error. Please try again later.");
        break;

      case 503:
        toast.error(getApiErrorMessage(data as ApiErrorData | unknown));
        break;

      default:
        toast.error("Unexpected error occurred.");
        break;
    }

    return Promise.reject(new ApiError(status, data));
  },
);

export default api;
