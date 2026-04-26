"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import ManagerShell from "@/components/manager/ManagerShell";
import ManagerStatCard from "@/components/manager/ManagerStatCard";
import UserSection from "@/components/manager/UserSection";
import { UserService } from "@/lib/userService";
import type { UserDto } from "@/types/user";

export default function ManagerUsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
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
  }, []);

  useEffect(() => {
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
  }, []);

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
