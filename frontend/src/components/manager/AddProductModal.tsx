"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";

import Modal from "@/components/common/Modal";
import { ManagerProductService } from "@/lib/managerProductService";
import { CreateProductRequestDto } from "@/types/product";

type AddProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: () => Promise<void>;
};

type ProductForm = {
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  imageUrl: string;
};

const initialForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  stockQuantity: "0",
  imageUrl: "",
};

export default function AddProductModal({
  isOpen,
  onClose,
  onProductCreated,
}: AddProductModalProps) {
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateForm = <Key extends keyof ProductForm>(
    key: Key,
    value: ProductForm[Key],
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

    const price = Number(form.price);
    const stockQuantity = Number(form.stockQuantity);
    const name = form.name.trim();
    const description = form.description.trim();
    const imageUrl = form.imageUrl.trim();

    if (!name || !description) {
      setSubmitting(false);
      setError("Name and description are required.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setSubmitting(false);
      setError("Price must be greater than 0.");
      return;
    }

    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      setSubmitting(false);
      setError("Stock quantity must be a whole number of 0 or more.");
      return;
    }

    const payload: CreateProductRequestDto = {
      name,
      description,
      price,
      stockQuantity,
      imageUrl: imageUrl || undefined,
    };

    try {
      await ManagerProductService.createProduct(payload);

      toast.success("Product created");
      setForm(initialForm);
      await onProductCreated();
      onClose();
    } catch {
      setError("Could not create product. Manager access may be required.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} dismissable={!submitting}>
      <div className="pr-10">
        <h2 className="text-2xl font-semibold text-base-content">
          Add product
        </h2>
        <p className="mt-2 text-sm text-base-content/60">
          Create a catalog item for the store backend.
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
          <span className="label-text mb-1">Description</span>
          <textarea
            className="textarea textarea-bordered min-h-32 w-full"
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
            maxLength={2000}
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-control">
            <span className="label-text mb-1">Price</span>
            <input
              type="number"
              className="input input-bordered w-full"
              value={form.price}
              onChange={(event) => updateForm("price", event.target.value)}
              min="0.01"
              step="0.01"
              required
            />
          </label>

          <label className="form-control">
            <span className="label-text mb-1">Stock quantity</span>
            <input
              type="number"
              className="input input-bordered w-full"
              value={form.stockQuantity}
              onChange={(event) =>
                updateForm("stockQuantity", event.target.value)
              }
              min="0"
              step="1"
              required
            />
          </label>
        </div>

        <label className="form-control">
          <span className="label-text mb-1">Image URL</span>
          <input
            type="url"
            className="input input-bordered w-full"
            value={form.imageUrl}
            onChange={(event) => updateForm("imageUrl", event.target.value)}
            maxLength={500}
          />
        </label>

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
            {submitting ? "Saving..." : "Save product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
