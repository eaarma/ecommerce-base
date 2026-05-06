"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";

import Modal from "@/components/common/Modal";
import { UserService } from "@/lib/userService";
import { CreateUserRequestDto } from "@/types/user";

type AddUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => Promise<void>;
};

const initialForm: CreateUserRequestDto = {
  name: "",
  email: "",
  password: "",
  role: "MANAGER",
  status: "ACTIVE",
};

export default function AddUserModal({
  isOpen,
  onClose,
  onUserCreated,
}: AddUserModalProps) {
  const [form, setForm] = useState<CreateUserRequestDto>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateForm = <Key extends keyof CreateUserRequestDto>(
    key: Key,
    value: CreateUserRequestDto[Key],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleClose = () => {
    if (submitting) return;

    setError(null);
    setForm(initialForm);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await UserService.createUser({
        ...form,
        email: form.email.trim(),
        name: form.name.trim(),
      });

      toast.success("User created");
      setForm(initialForm);
      await onUserCreated();
      onClose();
    } catch {
      setError("Could not create user. Admin access may be required.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} dismissable={!submitting}>
      <div className="pr-10">
        <h2 className="text-2xl font-semibold text-base-content">Add user</h2>
        <p className="mt-2 text-sm text-base-content/60">
          Create a staff account for the store backend.
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
          <span className="label-text mb-1">Email</span>
          <input
            type="email"
            className="input input-bordered w-full"
            value={form.email}
            onChange={(event) => updateForm("email", event.target.value)}
            maxLength={320}
            required
          />
        </label>

        <label className="form-control">
          <span className="label-text mb-1">Password</span>
          <input
            type="password"
            className="input input-bordered w-full"
            value={form.password}
            onChange={(event) => updateForm("password", event.target.value)}
            minLength={8}
            maxLength={100}
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-control">
            <span className="label-text mb-1">Role</span>
            <select
              className="select select-bordered w-full"
              value={form.role}
              onChange={(event) =>
                updateForm("role", event.target.value as CreateUserRequestDto["role"])
              }
            >
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <label className="form-control">
            <span className="label-text mb-1">Status</span>
            <select
              className="select select-bordered w-full"
              value={form.status}
              onChange={(event) =>
                updateForm(
                  "status",
                  event.target.value as CreateUserRequestDto["status"],
                )
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
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
            {submitting ? "Creating..." : "Create user"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
