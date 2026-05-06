"use client";

import { Pencil, Settings, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import AddUserModal from "@/components/manager/users/AddUserModal";
import EditUserModal from "@/components/manager/users/EditUserModal";
import { UserDto } from "@/types/user";

type UserSectionProps = {
  users: UserDto[];
  loading: boolean;
  error: string | null;
  onUserCreated: () => Promise<void>;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

export default function UserSection({
  users,
  loading,
  error,
  onUserCreated,
}: UserSectionProps) {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-base-300 bg-base-100">
        <div className="flex items-start justify-between gap-4 border-b border-base-300 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-base-content">Users</h2>
            <p className="text-sm text-base-content/60">
              Staff accounts available in the backend.
            </p>
          </div>

          <div className="dropdown dropdown-end">
            <button
              type="button"
              aria-label="User settings"
              title="User settings"
              className="btn btn-ghost btn-sm btn-square"
              onClick={() => setSettingsOpen((open) => !open)}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </button>

            {settingsOpen && (
              <ul className="dropdown-content menu z-20 mt-2 w-44 rounded-lg border border-base-300 bg-base-100 p-2 shadow">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      setAddUserOpen(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    Add user
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>

        {loading && (
          <div className="px-5 py-8 text-sm text-base-content/60">
            Loading users...
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-error">{error}</p>
            <button
              type="button"
              className="btn btn-outline btn-sm w-full sm:w-auto"
              onClick={() => router.push("/login")}
            >
              Login
            </button>
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="px-5 py-8 text-sm text-base-content/60">
            No users found.
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="w-12">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium text-base-content">
                      {user.name}
                    </td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span
                        className={`badge ${user.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        aria-label={`Edit ${user.name}`}
                        title="Edit user"
                        className="btn btn-ghost btn-sm btn-square"
                        onClick={() => setEditingUser(user)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AddUserModal
        isOpen={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        onUserCreated={onUserCreated}
      />

      {editingUser && (
        <EditUserModal
          key={editingUser.id}
          isOpen={Boolean(editingUser)}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUserUpdated={onUserCreated}
        />
      )}
    </>
  );
}
