"use client";

import { useMemo, useState } from "react";
import { CircleAlert } from "lucide-react";

import ProductActions from "@/components/products/ProductActions";
import ProductImageGallery from "@/components/products/ProductImageGallery";
import { formatProductCategory } from "@/types/product";
import type { ProductDto, ProductVariantDto } from "@/types/product";

type ProductDetailViewProps = {
  product: ProductDto;
};

type VariantOptionKey = "color" | "size" | "weight" | "material";

const OPTION_KEYS: VariantOptionKey[] = ["color", "size", "weight", "material"];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
});

const formatPrice = (price: number) => currencyFormatter.format(Number(price));
const normalizeOption = (value: string | null | undefined) => value?.trim() || null;

const isStorefrontVariant = (variant: ProductVariantDto) =>
  variant.status !== "ARCHIVED" && variant.status !== "DRAFT";

const isPurchasableVariant = (variant: ProductVariantDto) =>
  variant.status === "ACTIVE" && variant.stockQuantity > 0;

const findPreferredVariant = (variants: ProductVariantDto[]) =>
  variants.find(isPurchasableVariant) ??
  variants.find((variant) => variant.status === "ACTIVE") ??
  variants[0] ??
  null;

const getInventoryMeta = (variant: ProductVariantDto | null) => {
  if (!variant || variant.status === "OUT_OF_STOCK" || variant.stockQuantity <= 0) {
    return {
      tone: "border-error/20 bg-error/10 text-error",
      label: "Out of stock",
      helper: "This item cannot be added to cart right now.",
    };
  }

  if (variant.stockQuantity <= 3) {
    return {
      tone: "border-warning/20 bg-warning/10 text-base-content",
      label: `${variant.stockQuantity} left`,
      helper: "Low stock. This item may sell out soon.",
    };
  }

  return {
    tone: "border-success/20 bg-success/10 text-success",
    label: `${variant.stockQuantity} in stock`,
    helper: "Available and ready to order.",
  };
};

const buildOptionValues = (variants: ProductVariantDto[]) =>
  OPTION_KEYS.reduce<Record<VariantOptionKey, string[]>>(
    (values, key) => {
      values[key] = Array.from(
        new Set(
          variants
            .map((variant) => normalizeOption(variant[key]))
            .filter((value): value is string => Boolean(value)),
        ),
      );
      return values;
    },
    {
      color: [],
      size: [],
      weight: [],
      material: [],
    },
  );

const buildPurchasableOptionLookup = (variants: ProductVariantDto[]) =>
  OPTION_KEYS.reduce<Record<VariantOptionKey, Set<string>>>(
    (values, key) => {
      values[key] = new Set(
        variants
          .map((variant) => normalizeOption(variant[key]))
          .filter((value): value is string => Boolean(value)),
      );
      return values;
    },
    {
      color: new Set<string>(),
      size: new Set<string>(),
      weight: new Set<string>(),
      material: new Set<string>(),
    },
  );

const chooseBestVariantForOption = (
  currentVariant: ProductVariantDto | null,
  variants: ProductVariantDto[],
  key: VariantOptionKey,
  value: string,
) => {
  const candidates = variants.filter(
    (variant) => normalizeOption(variant[key]) === value,
  );

  if (candidates.length === 0) {
    return null;
  }

  if (!currentVariant) {
    return candidates[0];
  }

  return candidates.reduce((bestVariant, candidate) => {
    const bestScore = OPTION_KEYS.reduce((score, optionKey) => {
      if (optionKey === key) {
        return score;
      }

      const currentValue = normalizeOption(currentVariant[optionKey]);
      return currentValue && normalizeOption(bestVariant[optionKey]) === currentValue
        ? score + 1
        : score;
    }, 0);

    const candidateScore = OPTION_KEYS.reduce((score, optionKey) => {
      if (optionKey === key) {
        return score;
      }

      const currentValue = normalizeOption(currentVariant[optionKey]);
      return currentValue && normalizeOption(candidate[optionKey]) === currentValue
        ? score + 1
        : score;
    }, 0);

    if (candidateScore !== bestScore) {
      return candidateScore > bestScore ? candidate : bestVariant;
    }

    if (candidate.stockQuantity !== bestVariant.stockQuantity) {
      return candidate.stockQuantity > bestVariant.stockQuantity
        ? candidate
        : bestVariant;
    }

    return candidate.id < bestVariant.id ? candidate : bestVariant;
  });
};

export default function ProductDetailView({ product }: ProductDetailViewProps) {
  const categoryLabel = product.category
    ? formatProductCategory(product.category)
    : null;
  const storefrontVariants = useMemo(
    () => product.variants.filter(isStorefrontVariant),
    [product.variants],
  );
  const purchasableVariants = useMemo(
    () => storefrontVariants.filter(isPurchasableVariant),
    [storefrontVariants],
  );
  const preferredVariant = useMemo(
    () => findPreferredVariant(storefrontVariants),
    [storefrontVariants],
  );
  const selectableVariants = purchasableVariants.length > 0
    ? purchasableVariants
    : storefrontVariants;
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    preferredVariant?.id ?? null,
  );

  const selectedVariant = useMemo(
    () =>
      selectableVariants.find((variant) => variant.id === selectedVariantId) ??
      storefrontVariants.find((variant) => variant.id === selectedVariantId) ??
      preferredVariant,
    [preferredVariant, selectedVariantId, selectableVariants, storefrontVariants],
  );

  const inventoryMeta = getInventoryMeta(selectedVariant ?? null);
  const inStock =
    Boolean(selectedVariant) &&
    selectedVariant.status !== "OUT_OF_STOCK" &&
    selectedVariant.stockQuantity > 0;

  const optionValues = useMemo(
    () => buildOptionValues(storefrontVariants),
    [storefrontVariants],
  );
  const purchasableOptionLookup = useMemo(
    () => buildPurchasableOptionLookup(purchasableVariants),
    [purchasableVariants],
  );

  const galleryImages = useMemo(() => {
    const orderedImages = new Set<string>();

    const pushImage = (value?: string | null) => {
      const normalized = value?.trim();
      if (normalized) {
        orderedImages.add(normalized);
      }
    };

    pushImage(selectedVariant?.imageUrl);

    product.images
      .filter((image) => image.variantId === selectedVariant?.id)
      .forEach((image) => pushImage(image.imageUrl));

    pushImage(product.mainImageUrl);

    product.images
      .filter((image) => image.variantId == null)
      .forEach((image) => pushImage(image.imageUrl));

    pushImage(product.imageUrl);

    return Array.from(orderedImages);
  }, [
    product.imageUrl,
    product.images,
    product.mainImageUrl,
    selectedVariant?.id,
    selectedVariant?.imageUrl,
  ]);

  const traits = useMemo(() => {
    if (!product.traitsJson?.trim()) {
      return [];
    }

    try {
      const parsed = JSON.parse(product.traitsJson) as Record<string, unknown>;
      return Object.entries(parsed).filter(
        ([, value]) => value != null && String(value).trim() !== "",
      );
    } catch {
      return [];
    }
  }, [product.traitsJson]);

  const handleOptionClick = (key: VariantOptionKey, value: string) => {
    if (!selectedVariant) {
      return;
    }

    if (normalizeOption(selectedVariant[key]) === value) {
      return;
    }

    const nextVariant = chooseBestVariantForOption(
      selectedVariant,
      selectableVariants,
      key,
      value,
    );

    if (nextVariant) {
      setSelectedVariantId(nextVariant.id);
    }
  };

  return (
    <div className="overflow-hidden rounded-[28px] border border-base-300 bg-base-100 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <section className="space-y-6">
          <div className="overflow-hidden rounded-[24px] border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5">
            <ProductImageGallery
              key={selectedVariant?.id ?? product.id}
              images={galleryImages}
              title={product.name}
            />
          </div>

          {traits.length > 0 && (
            <div className="rounded-[24px] border border-base-300 bg-base-100 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/45">
                Product details
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {traits.map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-base-300 bg-base-200/40 p-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/45">
                      {label}
                    </p>
                    <p className="mt-2 text-sm text-base-content/75">
                      {String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="h-fit lg:sticky lg:top-8">
          <div className="space-y-6 p-6">
            <div>
              <h2 className="break-words text-3xl font-bold leading-tight text-base-content">
                {product.name}
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`badge border px-4 py-3 font-medium ${inventoryMeta.tone}`}
                >
                  {inventoryMeta.label}
                </span>
                {categoryLabel && (
                  <span className="badge border border-base-300 px-4 py-3 font-medium text-base-content/70">
                    {categoryLabel}
                  </span>
                )}
                {selectedVariant?.label && selectedVariant.label !== "Default" && (
                  <span className="badge border border-base-300 px-4 py-3 font-medium text-base-content/70">
                    {selectedVariant.label}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-base-300 bg-base-100 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/45">
                Description
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-base-content/75">
                {product.description || "No description available."}
              </p>
            </div>

            {OPTION_KEYS.map((key) => {
              const values = optionValues[key];

              if (values.length === 0) {
                return null;
              }

              return (
                <div
                  key={key}
                  className="rounded-[24px] border border-base-300 bg-base-100 p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/45">
                    {key}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {values.map((value) => {
                      const active =
                        normalizeOption(selectedVariant?.[key]) === value;
                      const purchasable = purchasableOptionLookup[key].has(value);

                      return (
                        <button
                          key={value}
                          type="button"
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                            active
                              ? "border-primary bg-primary text-primary-content"
                              : purchasable
                                ? "border-base-300 bg-base-100 text-base-content hover:border-primary/40 hover:text-primary"
                                : "cursor-not-allowed border-base-300 bg-base-200 text-base-content/35"
                          }`}
                          disabled={!active && !purchasable}
                          onClick={() => handleOptionClick(key, value)}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {!inStock && (
              <div className="rounded-[24px] border border-error/20 bg-error/5 p-4 text-sm leading-6 text-base-content/75">
                <div className="flex items-start gap-3">
                  <CircleAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-error" />
                  <p>
                    This product is currently unavailable, so checkout actions are
                    disabled until stock is updated.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-[24px] border border-primary/15 bg-base-100 p-5">
              <div className="border-b border-base-300 pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/45">
                  Price
                </p>
                <p className="mt-2 text-3xl font-bold text-base-content">
                  {formatPrice(Number(selectedVariant?.price ?? product.price))}
                </p>
                <p className="mt-2 text-sm leading-6 text-base-content/65">
                  {selectedVariant
                    ? inventoryMeta.helper
                    : "Select a variant to view stock and pricing."}
                </p>
              </div>

              <div className="pt-5">
                {selectedVariant ? (
                  <ProductActions
                    key={selectedVariant.id}
                    product={product}
                    selectedVariant={selectedVariant}
                    disabled={!inStock}
                  />
                ) : (
                  <button type="button" className="btn btn-disabled w-full">
                    No variant available
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
