"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import {
  getStoredAccessToken,
  getStoredAuthUser,
  handleExpiredSession,
  isJwtExpired,
  isStaffRole,
} from "@/lib/authSession";
import { clearAuth } from "@/store/authSlice";
import type { AppDispatch, RootState } from "@/store/store";

const STAFF_LOGIN_TOAST_ID = "staff-login-required";

export default function ManagerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const user = useSelector((state: RootState) => state.auth.user);
  const redirectingRef = useRef(false);
  const resolvedAccessToken = accessToken ?? getStoredAccessToken();
  const resolvedUser = user ?? getStoredAuthUser();

  const authState =
    !resolvedAccessToken || !resolvedUser
      ? "missing"
      : isJwtExpired(resolvedAccessToken)
        ? "expired"
        : !isStaffRole(resolvedUser.role)
          ? "forbidden"
          : "authorized";

  useEffect(() => {
    if (authState === "missing" || authState === "forbidden") {
      if (!redirectingRef.current) {
        redirectingRef.current = true;
        dispatch(clearAuth());
        toast.error("Please sign in with your staff account.", {
          id: STAFF_LOGIN_TOAST_ID,
        });
        router.replace("/login");
      }

      return;
    }

    if (authState === "expired") {
      handleExpiredSession();
      return;
    }

    redirectingRef.current = false;
  }, [authState, dispatch, router]);

  if (authState !== "authorized") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 py-16">
        <div className="rounded-3xl border border-base-300 bg-base-100 px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-medium text-base-content/70">
            Checking staff session...
          </p>
        </div>
      </div>
    );
  }

  return children;
}
