"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";

import Modal from "@/components/common/Modal";
import { UserService } from "@/lib/userService";
import { UpdateUserRequestDto, UserDto } from "@/types/user";

type EditUserModalProps = {
  isOpen: boolean;
  user: UserDto;
  onClose: () => void;
  onUserUpdated: () => Promise<void>;
};

export default function EditUserModal({
  isOpen,
  user,
  onClose,
  onUserUpdated,
}: EditUserModalProps) {
  const [form, setForm] = useState<UpdateUserRequestDto>({
    name: user.name,
    status: user.status,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateForm = <Key extends keyof UpdateUserRequestDto>(
    key: Key,
    value: UpdateUserRequestDto[Key],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleClose = () => {
    if (submitting) return;

    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await UserService.updateUser(user.id, {
        name: form.name.trim(),
        status: form.status,
      });

      toast.success("User updated");
      await onUserUpdated();
      onClose();
    } catch {
      setError("Could not update user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} dismissable={!submitting}>
      <div className="pr-10">
        <h2 className="text-2xl font-semibold text-base-content">Edit user</h2>
        <p className="mt-2 text-sm text-base-content/60">
          Update this staff account&apos;s display name and status.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <label className="form-control">
          <span className="label-text mb-1">Name</span>
          <input
            type="text"
            className="input input-bordered w-full"
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            maxLength={150}
            required
          />
        </label>

        <label className="form-control">
          <span className="label-text mb-1">Status</span>
          <select
            className="select select-bordered w-full"
            value={form.status}
            onChange={(event) =>
              updateForm(
                "status",
                event.target.value as UpdateUserRequestDto["status"],
              )
            }
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>

        <div className="rounded-lg border border-base-300 bg-base-200 px-4 py-3 text-sm text-base-content/70">
          {user.email}
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
