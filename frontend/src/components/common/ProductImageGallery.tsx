"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";

export type ProductImageGalleryItem = {
  id?: number | string;
  imageUrl: string;
  altText?: string | null;
  isPrimary?: boolean;
};

type ProductImageGalleryProps = {
  images?: Array<string | ProductImageGalleryItem>;
  title?: string;
  placeholderSrc?: string;
};

const DEFAULT_PLACEHOLDER_IMAGE = "/images/item_placeholder.jpg";

export default function ProductImageGallery({
  images = [],
  title = "Product image gallery",
  placeholderSrc = DEFAULT_PLACEHOLDER_IMAGE,
}: ProductImageGalleryProps) {
  const normalizedImages = useMemo(
    () => normalizeImages(images),
    [images],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const safeSelectedIndex =
    normalizedImages.length === 0
      ? 0
      : Math.min(selectedIndex, normalizedImages.length - 1);

  const activeImage =
    normalizedImages.length > 0
      ? normalizedImages[safeSelectedIndex]
      : {
          id: "placeholder",
          imageUrl: placeholderSrc,
          altText: title,
          isPrimary: false,
        };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[24px] border border-base-300 bg-base-100">
        <img
          src={activeImage.imageUrl || placeholderSrc}
          alt={activeImage.altText || title}
          className={`h-72 w-full object-cover sm:h-80 lg:h-[420px] ${
            normalizedImages.length === 0 ? "opacity-70 grayscale-[0.3]" : ""
          }`}
          onError={(event) => {
            event.currentTarget.src = placeholderSrc;
            event.currentTarget.classList.add("opacity-70", "grayscale-[0.3]");
          }}
        />
      </div>

      {normalizedImages.length > 1 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {normalizedImages.map((image, index) => (
            <button
              key={image.id ?? `${image.imageUrl}-${index}`}
              type="button"
              className={`group relative overflow-hidden rounded-2xl border text-left transition ${
                index === safeSelectedIndex
                  ? "border-primary shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
                  : "border-base-300 hover:border-primary/40"
              }`}
              onClick={() => setSelectedIndex(index)}
            >
              <img
                src={image.imageUrl || placeholderSrc}
                alt={image.altText || `${title} ${index + 1}`}
                className="h-24 w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = placeholderSrc;
                  event.currentTarget.classList.add(
                    "opacity-70",
                    "grayscale-[0.3]",
                  );
                }}
              />

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white">
                <span className="truncate">
                  {image.altText?.trim() || `Image ${index + 1}`}
                </span>
                {image.isPrimary && (
                  <span className="rounded-full bg-white/20 px-2 py-1 font-medium">
                    Primary
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function normalizeImages(images: Array<string | ProductImageGalleryItem>) {
  return images.map((image, index) =>
    typeof image === "string"
      ? {
          id: `image-${index}`,
          imageUrl: image,
          altText: null,
          isPrimary: index === 0,
        }
      : {
          id: image.id ?? `image-${index}`,
          imageUrl: image.imageUrl,
          altText: image.altText ?? null,
          isPrimary: Boolean(image.isPrimary),
        },
  );
}
