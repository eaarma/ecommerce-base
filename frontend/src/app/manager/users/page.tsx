"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

import ManagerShell from "@/components/manager/layout/ManagerShell";
import ManagerStatCard from "@/components/manager/shared/ManagerStatCard";
import UserSection from "@/components/manager/users/UserSection";
import { getStoredAuthUser } from "@/lib/authSession";
import { UserService } from "@/lib/userService";
import type { RootState } from "@/store/store";
import type { UserDto } from "@/types/user";

const ADMIN_ONLY_TOAST_ID = "admin-only-users-page";

export default function ManagerUsersPage() {
  const router = useRouter();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const resolvedUser = authUser ?? getStoredAuthUser();
  const isAdmin = resolvedUser?.role === "ADMIN";
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await UserService.getAllUsers();
      setUsers(data);
    } catch {
      setError("Could not load users. Please sign in with a staff account.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Admin access is required to manage users.", {
        id: ADMIN_ONLY_TOAST_ID,
      });
      router.replace("/manager");
      return;
    }

    let cancelled = false;

    UserService.getAllUsers()
      .then((data) => {
        if (!cancelled) {
          setUsers(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load users. Please sign in with a staff account.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, router]);

  const activeUsers = useMemo(
    () => users.filter((user) => user.status === "ACTIVE").length,
    [users],
  );
  const inactiveUsers = useMemo(
    () => users.filter((user) => user.status === "INACTIVE").length,
    [users],
  );
  const managerUsers = useMemo(
    () => users.filter((user) => user.role === "MANAGER").length,
    [users],
  );

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 py-16">
        <div className="rounded-3xl border border-base-300 bg-base-100 px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-medium text-base-content/70">
            Checking admin access...
          </p>
        </div>
      </div>
      );
  }

  return (
    <ManagerShell
      title="Users"
      description="Staff-specific account and access management."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ManagerStatCard label="Total Users" value={users.length.toString()} />
        <ManagerStatCard label="Active Users" value={activeUsers.toString()} />
        <ManagerStatCard label="Inactive Users" value={inactiveUsers.toString()} />
        <ManagerStatCard label="Managers" value={managerUsers.toString()} />
      </div>

      <UserSection
        users={users}
        loading={loading}
        error={error}
        onUserCreated={loadUsers}
      />
    </ManagerShell>
  );
}
