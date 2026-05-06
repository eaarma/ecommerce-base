"use client";

import toast from "react-hot-toast";

import type { AuthUserDto, UserRole } from "@/types/auth";
import { clearAuth } from "@/store/authSlice";
import { store } from "@/store/store";

const LOGIN_PATH = "/login";
const SESSION_EXPIRED_TOAST_ID = "session-expired";
const EXPIRY_BUFFER_MS = 5_000;
const STAFF_ROLES = new Set<UserRole>(["ADMIN", "MANAGER"]);

let isSessionExpiryHandling = false;

type JwtPayload = {
  exp?: number;
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  return atob(padded);
};

export const getJwtExpirationTime = (token: string): number | null => {
  try {
    const [, payload] = token.split(".");

    if (!payload) {
      return null;
    }

    const parsedPayload = JSON.parse(decodeBase64Url(payload)) as JwtPayload;

    if (typeof parsedPayload.exp !== "number") {
      return null;
    }

    return parsedPayload.exp * 1000;
  } catch {
    return null;
  }
};

export const getStoredAccessToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("accessToken");
};

export const getStoredAuthUser = (): AuthUserDto | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = localStorage.getItem("authUser");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUserDto;
  } catch {
    return null;
  }
};

export const isJwtExpired = (token: string, now = Date.now()) => {
  const expirationTime = getJwtExpirationTime(token);

  if (expirationTime == null) {
    return true;
  }

  return expirationTime <= now + EXPIRY_BUFFER_MS;
};

export const isStaffRole = (role: string | null | undefined): role is UserRole =>
  role != null && STAFF_ROLES.has(role as UserRole);

export const handleExpiredSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (isSessionExpiryHandling) {
    return;
  }

  isSessionExpiryHandling = true;
  store.dispatch(clearAuth());

  toast.error("Session is expired", {
    id: SESSION_EXPIRED_TOAST_ID,
  });

  if (window.location.pathname !== LOGIN_PATH) {
    window.location.assign(LOGIN_PATH);
  }

  window.setTimeout(() => {
    isSessionExpiryHandling = false;
  }, 1000);
};
