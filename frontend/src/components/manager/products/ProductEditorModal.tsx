"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CopyPlus, PackagePlus, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import Modal from "@/components/common/Modal";
import ProductImagesManager from "@/components/manager/products/ProductImagesManager";
import { ManagerProductService } from "@/lib/managerProductService";
import { deleteProductImageFromFirebase } from "@/lib/productImageUploadService";
import { PRODUCT_CATEGORY_LABELS } from "@/types/product";
import type {
  CreateProductImageRequestDto,
  ProductCategory,
  CreateProductVariantRequestDto,
  ProductImageDto,
  ProductDto,
  ProductStatus,
  UpdateProductRequestDto,
} from "@/types/product";

type ProductEditorModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  product?: ProductDto | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

type VariantForm = {
  clientId: string;
  id?: number;
  sku: string;
  color: string;
  size: string;
  weight: string;
  material: string;
  price: string;
  stockQuantity: string;
  images: ProductImageDto[];
  status: ProductStatus;
};

type TraitForm = {
  clientId: string;
  key: string;
  value: string;
};

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  basePrice: string;
  category: ProductCategory | "";
  status: ProductStatus;
  images: ProductImageDto[];
  traits: TraitForm[];
  variants: VariantForm[];
};

const productStatusOptions: Array<{ label: string; value: ProductStatus }> = [
  { label: "Draft", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
  { label: "Out of stock", value: "OUT_OF_STOCK" },
  { label: "Archived", value: "ARCHIVED" },
];
const productCategoryOptions = (
  Object.entries(PRODUCT_CATEGORY_LABELS) as Array<[ProductCategory, string]>
).map(([value, label]) => ({ value, label }));

const createClientId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createEmptyVariant = (): VariantForm => ({
  clientId: createClientId(),
  sku: "",
  color: "",
  size: "",
  weight: "",
  material: "",
  price: "",
  stockQuantity: "0",
  images: [],
  status: "ACTIVE",
});

const createFallbackImage = (
  imageUrl: string,
  variantId: number | null,
): ProductImageDto => ({
  id: createTemporaryImageId(),
  variantId,
  imageUrl,
  storagePath: null,
  altText: null,
  sortOrder: 0,
  isPrimary: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const ensureImages = (
  images: ProductImageDto[] | undefined,
  fallbackImageUrl: string | null | undefined,
  variantId: number | null,
) => {
  if (images && images.length > 0) {
    return normalizeImages(images);
  }

  const normalizedFallbackUrl = fallbackImageUrl?.trim();
  return normalizedFallbackUrl
    ? [createFallbackImage(normalizedFallbackUrl, variantId)]
    : [];
};

const parseTraitsJson = (
  traitsJson: string | null | undefined,
): TraitForm[] => {
  if (!traitsJson?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(traitsJson) as Record<string, unknown>;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return [];
    }

    return Object.entries(parsed)
      .filter(
        ([key, value]) =>
          key.trim() !== "" && value != null && String(value).trim() !== "",
      )
      .map(([key, value]) => ({
        clientId: createClientId(),
        key,
        value: String(value),
      }));
  } catch {
    return [];
  }
};

const toForm = (product?: ProductDto | null): ProductForm => {
  if (!product) {
    return {
      name: "",
      slug: "",
      description: "",
      basePrice: "",
      category: "",
      status: "DRAFT",
      images: [],
      traits: [],
      variants: [createEmptyVariant()],
    };
  }

  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: String(product.basePrice ?? product.price),
    category: product.category ?? "",
    status: product.status,
    images: ensureImages(
      product.images,
      product.mainImageUrl ?? product.imageUrl,
      null,
    ),
    traits: parseTraitsJson(product.traitsJson),
    variants:
      product.variants.length > 0
        ? product.variants.map((variant) => ({
            clientId: createClientId(),
            id: variant.id,
            sku: variant.sku,
            color: variant.color ?? "",
            size: variant.size ?? "",
            weight: variant.weight ?? "",
            material: variant.material ?? "",
            price: String(variant.price),
            stockQuantity: String(variant.stockQuantity),
            images: ensureImages(variant.images, variant.imageUrl, variant.id),
            status: variant.status,
          }))
        : [createEmptyVariant()],
  };
};

const formatVariantTitle = (variant: VariantForm, index: number) => {
  const parts = [variant.color, variant.size, variant.weight, variant.material]
    .map((value) => value.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : `Variant ${index + 1}`;
};

export default function ProductEditorModal({
  isOpen,
  mode,
  product,
  onClose,
  onSaved,
}: ProductEditorModalProps) {
  const [form, setForm] = useState<ProductForm>(() => toForm(product));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));
  const [pendingTraitKey, setPendingTraitKey] = useState("");
  const [pendingTraitValue, setPendingTraitValue] = useState("");
  const formRef = useRef(form);
  const saveSucceededRef = useRef(false);
  const removedPersistedStoragePathsRef = useRef<Set<string>>(new Set());

  const title = mode === "create" ? "Add product" : "Edit product";
  const description =
    mode === "create"
      ? "Create a shared product with purchasable variants."
      : "Update this product family and its purchasable variants.";
  const draftProductKey = slugify(form.slug || form.name || "draft-product");

  const submitLabel = mode === "create" ? "Save product" : "Save changes";
  const submittingLabel = mode === "create" ? "Saving..." : "Saving...";

  const variantCount = form.variants.length;

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    return () => {
      if (saveSucceededRef.current) {
        return;
      }

      const temporaryUploadStoragePaths =
        collectTemporaryUploadStoragePaths(formRef.current);

      if (temporaryUploadStoragePaths.length === 0) {
        return;
      }

      void deleteFirebaseStoragePaths(temporaryUploadStoragePaths).then(
        (failedStoragePaths) => {
          if (failedStoragePaths.length > 0) {
            toast.error("Some unsaved uploaded images could not be cleaned up.");
          }
        },
      );
    };
  }, []);

  const updateForm = <Key extends keyof ProductForm>(
    key: Key,
    value: ProductForm[Key],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateName = (value: string) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: slugTouched ? current.slug : slugify(value),
    }));
  };

  const updateImages = (updater: React.SetStateAction<ProductImageDto[]>) => {
    setForm((current) => ({
      ...current,
      images:
        typeof updater === "function"
          ? normalizeImages(updater(current.images))
          : normalizeImages(updater),
    }));
  };

  const updateTrait = (
    clientId: string,
    field: "key" | "value",
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      traits: current.traits.map((trait) =>
        trait.clientId === clientId
          ? {
              ...trait,
              [field]: value,
            }
          : trait,
      ),
    }));
  };

  const addTrait = () => {
    const key = pendingTraitKey.trim();
    const value = pendingTraitValue.trim();

    if (!key || !value) {
      setError("Trait and value are both required.");
      return;
    }

    const normalizedKey = key.toLowerCase();
    const keyExists = form.traits.some(
      (trait) => trait.key.trim().toLowerCase() === normalizedKey,
    );

    if (keyExists) {
      setError(`Trait "${key}" already exists.`);
      return;
    }

    setForm((current) => ({
      ...current,
      traits: [
        ...current.traits,
        {
          clientId: createClientId(),
          key,
          value,
        },
      ],
    }));
    setPendingTraitKey("");
    setPendingTraitValue("");
    setError(null);
  };

  const removeTrait = (clientId: string) => {
    setForm((current) => ({
      ...current,
      traits: current.traits.filter((trait) => trait.clientId !== clientId),
    }));
  };

  const registerPersistedImageRemoval = (image: ProductImageDto) => {
    const normalizedStoragePath = image.storagePath?.trim();

    if (image.id > 0 && normalizedStoragePath) {
      removedPersistedStoragePathsRef.current.add(normalizedStoragePath);
    }
  };

  const updateVariant = <Key extends keyof VariantForm>(
    clientId: string,
    key: Key,
    value: VariantForm[Key],
  ) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.clientId === clientId
          ? {
              ...variant,
              [key]: value,
            }
          : variant,
      ),
    }));
  };

  const updateVariantImages = (
    clientId: string,
    updater: React.SetStateAction<ProductImageDto[]>,
  ) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant) => {
        if (variant.clientId !== clientId) {
          return variant;
        }

        const nextImages =
          typeof updater === "function" ? updater(variant.images) : updater;

        return {
          ...variant,
          images: normalizeImages(nextImages),
        };
      }),
    }));
  };

  const addVariant = (source?: VariantForm) => {
    setForm((current) => ({
      ...current,
      variants: [
        ...current.variants,
        source
          ? {
              ...source,
              clientId: createClientId(),
              id: undefined,
              sku: source.sku ? `${source.sku}-copy` : "",
              images: [],
            }
          : createEmptyVariant(),
      ],
    }));
  };

  const removeOrArchiveVariant = async (clientId: string) => {
    const variantToRemove = form.variants.find(
      (variant) => variant.clientId === clientId,
    );

    if (!variantToRemove) {
      return;
    }

    if (!variantToRemove.id) {
      const temporaryUploadStoragePaths = variantToRemove.images
        .filter((image) => image.id < 0)
        .map((image) => image.storagePath?.trim())
        .filter((storagePath): storagePath is string => Boolean(storagePath));

      if (temporaryUploadStoragePaths.length > 0) {
        const failedStoragePaths = await deleteFirebaseStoragePaths(
          temporaryUploadStoragePaths,
        );

        if (failedStoragePaths.length > 0) {
          toast.error("Could not clean up the removed variant images.");
          return;
        }
      }
    }

    setForm((current) => ({
      ...current,
      variants: current.variants
        .map((variant) =>
          variant.clientId === clientId && variant.id
            ? { ...variant, status: "ARCHIVED" as ProductStatus }
            : variant,
        )
        .filter((variant) => !(variant.clientId === clientId && !variant.id)),
    }));
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const buildVariantPayload = (): CreateProductVariantRequestDto[] | null => {
    if (form.variants.length === 0) {
      setError("Add at least one variant.");
      return null;
    }

    const seenSkus = new Set<string>();

    try {
      return form.variants.map((variant, index) => {
        const sku = variant.sku.trim();
        const price = Number(variant.price);
        const stockQuantity = Number(variant.stockQuantity);

        if (!sku) {
          throw new Error(`Variant ${index + 1} is missing a SKU.`);
        }

        const normalizedSku = sku.toLowerCase();
        if (seenSkus.has(normalizedSku)) {
          throw new Error(`Variant SKU "${sku}" is duplicated.`);
        }
        seenSkus.add(normalizedSku);

        if (!Number.isFinite(price) || price <= 0) {
          throw new Error(`Variant ${index + 1} price must be greater than 0.`);
        }

        if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
          throw new Error(
            `Variant ${index + 1} stock quantity must be a whole number of 0 or more.`,
          );
        }

        return {
          id: isPersistedId(variant.id) ? variant.id : undefined,
          sku,
          color: variant.color.trim() || undefined,
          size: variant.size.trim() || undefined,
          weight: variant.weight.trim() || undefined,
          material: variant.material.trim() || undefined,
          price,
          stockQuantity,
          imageUrl: resolvePrimaryImageUrl(variant.images) || undefined,
          images: buildImagePayload(variant.images),
          status: variant.status,
        };
      });
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Variant details are invalid.",
      );
      return null;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveSucceededRef.current = false;
    setSubmitting(true);
    setError(null);

    const name = form.name.trim();
    const slug = slugify(form.slug);
    const description = form.description.trim();
    const basePrice = Number(form.basePrice);

    if (!name || !description || !slug) {
      setSubmitting(false);
      setError("Name, slug, and description are required.");
      return;
    }

    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      setSubmitting(false);
      setError("Base price must be greater than 0.");
      return;
    }

    const normalizedTraits = form.traits
      .map((trait) => ({
        key: trait.key.trim(),
        value: trait.value.trim(),
      }))
      .filter((trait) => trait.key !== "" && trait.value !== "");
    const normalizedTraitKeys = new Set<string>();

    for (const trait of normalizedTraits) {
      const normalizedKey = trait.key.toLowerCase();
      if (normalizedTraitKeys.has(normalizedKey)) {
        setSubmitting(false);
        setError(`Trait "${trait.key}" is duplicated.`);
        return;
      }
      normalizedTraitKeys.add(normalizedKey);
    }

    const normalizedTraitsJson =
      normalizedTraits.length > 0
        ? JSON.stringify(
            Object.fromEntries(
              normalizedTraits.map((trait) => [trait.key, trait.value]),
            ),
          )
        : undefined;

    const variants = buildVariantPayload();

    if (!variants) {
      setSubmitting(false);
      return;
    }

    const payloadBase = {
      name,
      slug,
      description,
      basePrice,
      category: form.category || undefined,
      status: form.status,
      mainImageUrl: resolvePrimaryImageUrl(form.images) || undefined,
      traitsJson: normalizedTraitsJson,
      variants,
      images: buildImagePayload(form.images),
    } satisfies UpdateProductRequestDto;

    try {
      if (mode === "create") {
        await ManagerProductService.createProduct(payloadBase);
      } else if (product) {
        await ManagerProductService.updateProduct(product.id, payloadBase);
      }
    } catch {
      setError(
        mode === "create"
          ? "Could not create product. Manager access may be required."
          : "Could not update product. Manager access may be required.",
      );
      setSubmitting(false);
      return;
    }

    saveSucceededRef.current = true;

    const removedPersistedStoragePaths = Array.from(
      removedPersistedStoragePathsRef.current,
    );
    const failedRemovedStoragePaths =
      removedPersistedStoragePaths.length > 0
        ? await deleteFirebaseStoragePaths(removedPersistedStoragePaths)
        : [];
    removedPersistedStoragePathsRef.current.clear();

    if (failedRemovedStoragePaths.length > 0) {
      toast.error("Product saved, but some removed images could not be deleted.");
    }

    try {
      await onSaved();
    } catch {
      toast.error("Product saved, but the product list could not be refreshed.");
    }

    toast.success(mode === "create" ? "Product created" : "Product updated");
    setSubmitting(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} dismissable={!submitting}>
      <div className="pr-10">
        <h2 className="text-2xl font-semibold text-base-content">{title}</h2>
        <p className="mt-2 text-sm text-base-content/60">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-control">
            <span className="label-text mb-1">Name</span>
            <input
              type="text"
              className="input input-bordered w-full"
              value={form.name}
              onChange={(event) => updateName(event.target.value)}
              maxLength={150}
              required
            />
          </label>

          <label className="form-control">
            <span className="label-text mb-1">Slug</span>
            <input
              type="text"
              className="input input-bordered w-full"
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                updateForm("slug", event.target.value);
              }}
              maxLength={180}
              required
            />
          </label>
        </div>

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

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="form-control">
            <span className="label-text mb-1">Base price</span>
            <input
              type="number"
              className="input input-bordered w-full"
              value={form.basePrice}
              onChange={(event) => updateForm("basePrice", event.target.value)}
              min="0.01"
              step="0.01"
              required
            />
          </label>

          <label className="form-control">
            <span className="label-text mb-1">Category</span>
            <select
              className="select select-bordered w-full"
              value={form.category}
              onChange={(event) =>
                updateForm("category", event.target.value as ProductCategory | "")
              }
            >
              <option value="">No category</option>
              {productCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

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
        </div>

        <section className="space-y-4 border-t border-base-300 bg-base-100 p-2">
          <div className="mt-2">
            <h3 className="text-lg font-semibold text-base-content">
              Product traits
            </h3>
            <p className="mt-1 text-sm leading-6 text-base-content/65">
              Add simple trait and value pairs. These are stored as JSON for the
              storefront automatically when you save.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <label className="form-control">
              <span className="label-text mb-1">Trait</span>
              <input
                type="text"
                className="input input-bordered w-full"
                value={pendingTraitKey}
                onChange={(event) => setPendingTraitKey(event.target.value)}
                placeholder="Material"
                maxLength={120}
              />
            </label>

            <label className="form-control">
              <span className="label-text mb-1">Value</span>
              <input
                type="text"
                className="input input-bordered w-full"
                value={pendingTraitValue}
                onChange={(event) => setPendingTraitValue(event.target.value)}
                placeholder="100% cotton"
                maxLength={240}
              />
            </label>

            <div className="flex items-end">
              <button
                type="button"
                className="btn btn-outline w-full sm:w-auto"
                onClick={addTrait}
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          {form.traits.length > 0 ? (
            <div className="space-y-3">
              {form.traits.map((trait, index) => (
                <div
                  key={trait.clientId}
                  className="grid gap-3 rounded-2xl border border-base-300 bg-base-200/30 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <label className="form-control">
                    <span className="label-text mb-1">Trait {index + 1}</span>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={trait.key}
                      onChange={(event) =>
                        updateTrait(trait.clientId, "key", event.target.value)
                      }
                      maxLength={120}
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-1">Value</span>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={trait.value}
                      onChange={(event) =>
                        updateTrait(trait.clientId, "value", event.target.value)
                      }
                      maxLength={240}
                    />
                  </label>

                  <div className="flex items-end">
                    <button
                      type="button"
                      className="btn btn-outline btn-error w-full sm:w-auto"
                      onClick={() => removeTrait(trait.clientId)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-base-300 bg-base-200/30 px-4 py-6 text-sm text-base-content/60">
              No traits added yet.
            </div>
          )}
        </section>

        <ProductImagesManager
          productId={product?.id}
          draftKey={draftProductKey}
          images={form.images}
          setImages={updateImages}
          onPersistedImageRemoved={registerPersistedImageRemoval}
          disabled={submitting}
          title="Product gallery"
          description="Upload and arrange the shared gallery for this product. The first image becomes the primary product image when you save."
          emptyLabel="No product images uploaded yet."
        />

        <div className="border-t border-base-300 bg-base-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-2 mt-2">
            <div>
              <h3 className="text-lg font-semibold text-base-content">
                Variants
              </h3>
              <p className="text-sm text-base-content/60">
                {variantCount} purchasable{" "}
                {variantCount === 1 ? "variant" : "variants"} attached to this
                product.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => addVariant()}
            >
              <PackagePlus className="h-4 w-4" />
              Add variant
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {form.variants.map((variant, index) => (
              <div
                key={variant.clientId}
                className="rounded-2xl border border-base-300 bg-base-200/30 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-base-content">
                      {formatVariantTitle(variant, index)}
                    </p>
                    <p className="text-sm text-base-content/60">
                      SKU: {variant.sku.trim() || "Not set yet"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => addVariant(variant)}
                    >
                      <CopyPlus className="h-3.5 w-3.5" />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-error btn-xs"
                      onClick={() => void removeOrArchiveVariant(variant.clientId)}
                      disabled={form.variants.length === 1 && !variant.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {variant.id ? "Archive" : "Remove"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <label className="form-control">
                    <span className="label-text mb-1">SKU</span>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={variant.sku}
                      onChange={(event) =>
                        updateVariant(
                          variant.clientId,
                          "sku",
                          event.target.value,
                        )
                      }
                      maxLength={120}
                      required
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-1">Color</span>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={variant.color}
                      onChange={(event) =>
                        updateVariant(
                          variant.clientId,
                          "color",
                          event.target.value,
                        )
                      }
                      maxLength={120}
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-1">Size</span>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={variant.size}
                      onChange={(event) =>
                        updateVariant(
                          variant.clientId,
                          "size",
                          event.target.value,
                        )
                      }
                      maxLength={120}
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-1">Weight</span>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={variant.weight}
                      onChange={(event) =>
                        updateVariant(
                          variant.clientId,
                          "weight",
                          event.target.value,
                        )
                      }
                      maxLength={120}
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-1">Material</span>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={variant.material}
                      onChange={(event) =>
                        updateVariant(
                          variant.clientId,
                          "material",
                          event.target.value,
                        )
                      }
                      maxLength={120}
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-1">Price</span>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={variant.price}
                      onChange={(event) =>
                        updateVariant(
                          variant.clientId,
                          "price",
                          event.target.value,
                        )
                      }
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-1">Stock</span>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={variant.stockQuantity}
                      onChange={(event) =>
                        updateVariant(
                          variant.clientId,
                          "stockQuantity",
                          event.target.value,
                        )
                      }
                      min="0"
                      step="1"
                      required
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-1">Status</span>
                    <select
                      className="select select-bordered w-full"
                      value={variant.status}
                      onChange={(event) =>
                        updateVariant(
                          variant.clientId,
                          "status",
                          event.target.value as ProductStatus,
                        )
                      }
                    >
                      {productStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-4">
                  <ProductImagesManager
                    productId={product?.id}
                    draftKey={`${draftProductKey}-${variant.clientId}`}
                    variantId={variant.id}
                    images={variant.images}
                    setImages={(updater) =>
                      updateVariantImages(variant.clientId, updater)
                    }
                    onPersistedImageRemoved={registerPersistedImageRemoval}
                    disabled={submitting}
                    title="Variant gallery"
                    description="Upload images just for this variant. The first image becomes the variant's primary image when you save."
                    emptyLabel="No variant images uploaded yet."
                  />
                </div>
              </div>
            ))}
          </div>
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
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? submittingLabel : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

let nextTemporaryImageId = -1;

function createTemporaryImageId() {
  return nextTemporaryImageId--;
}

function normalizeImages(images: ProductImageDto[]) {
  return [...images]
    .sort((left, right) => {
      if (left.isPrimary !== right.isPrimary) {
        return left.isPrimary ? -1 : 1;
      }

      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.id - right.id;
    })
    .map((image, index) => ({
      ...image,
      sortOrder: index,
      isPrimary: index === 0,
    }));
}

function resolvePrimaryImageUrl(images: ProductImageDto[]) {
  return normalizeImages(images)
    .map((image) => image.imageUrl.trim())
    .find(Boolean);
}

function buildImagePayload(
  images: ProductImageDto[],
): CreateProductImageRequestDto[] {
  return normalizeImages(images).map((image, index) => ({
    id: isPersistedId(image.id) ? image.id : undefined,
    variantId: image.variantId,
    imageUrl: image.imageUrl,
    storagePath: image.storagePath ?? undefined,
    altText: image.altText ?? undefined,
    sortOrder: index,
    isPrimary: index === 0,
  }));
}

function collectTemporaryUploadStoragePaths(form: ProductForm) {
  return [
    ...form.images,
    ...form.variants.flatMap((variant) => variant.images),
  ]
    .filter((image) => image.id < 0)
    .map((image) => image.storagePath?.trim())
    .filter((storagePath): storagePath is string => Boolean(storagePath));
}

async function deleteFirebaseStoragePaths(storagePaths: string[]) {
  const uniqueStoragePaths = Array.from(
    new Set(storagePaths.map((storagePath) => storagePath.trim()).filter(Boolean)),
  );

  if (uniqueStoragePaths.length === 0) {
    return [] as string[];
  }

  const deletionResults = await Promise.allSettled(
    uniqueStoragePaths.map((storagePath) =>
      deleteProductImageFromFirebase(storagePath),
    ),
  );

  return deletionResults.flatMap((result, index) =>
    result.status === "rejected" ? [uniqueStoragePaths[index]] : [],
  );
}

function isPersistedId(id: number | undefined) {
  return typeof id === "number" && id > 0;
}
