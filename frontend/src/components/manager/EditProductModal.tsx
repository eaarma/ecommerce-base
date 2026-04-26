"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";

import Modal from "@/components/common/Modal";
import { ManagerProductService } from "@/lib/managerProductService";
import {
  ProductDto,
  ProductStatus,
  UpdateProductRequestDto,
} from "@/types/product";

type EditProductModalProps = {
  isOpen: boolean;
  product: ProductDto;
  onClose: () => void;
  onProductUpdated: () => Promise<void>;
};

type ProductForm = {
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  status: ProductStatus;
  imageUrl: string;
};

const toForm = (product: ProductDto): ProductForm => ({
  name: product.name,
  description: product.description,
  price: String(product.price),
  stockQuantity: String(product.stockQuantity),
  status: product.status,
  imageUrl: product.imageUrl ?? "",
});

const productStatusOptions: Array<{ label: string; value: ProductStatus }> = [
  { label: "Draft", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
  { label: "Out of stock", value: "OUT_OF_STOCK" },
  { label: "Archived", value: "ARCHIVED" },
];

export default function EditProductModal({
  isOpen,
  product,
  onClose,
  onProductUpdated,
}: EditProductModalProps) {
  const [form, setForm] = useState<ProductForm>(() => toForm(product));
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
    setForm(toForm(product));
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

    const payload: UpdateProductRequestDto = {
      name,
      description,
      price,
      stockQuantity,
      status: form.status,
      imageUrl: imageUrl || undefined,
    };

    try {
      await ManagerProductService.updateProduct(product.id, payload);

      toast.success("Product updated");
      await onProductUpdated();
      onClose();
    } catch {
      setError("Could not update product. Manager access may be required.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} dismissable={!submitting}>
      <div className="pr-10">
        <h2 className="text-2xl font-semibold text-base-content">
          Edit product
        </h2>
        <p className="mt-2 text-sm text-base-content/60">
          Update this catalog item&apos;s details.
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
          <span className="label-text mb-1">Status</span>
          <select
            className="select select-bordered w-full"
            value={form.status}
            onChange={(event) =>
              updateForm("status", event.target.value as ProductStatus)
            }
            required
          >
            {productStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

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
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
