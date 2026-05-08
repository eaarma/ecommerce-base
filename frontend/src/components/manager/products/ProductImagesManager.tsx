"use client";

import { useId, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  LoaderCircle,
  Star,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import ConfirmActionModal from "@/components/common/ConfirmActionModal";
import ProductImageGallery from "@/components/common/ProductImageGallery";
import {
  deleteProductImageFromFirebase,
  uploadProductImageToFirebase,
} from "@/lib/productImageUploadService";
import type { ProductImageDto } from "@/types/product";

type ProductImagesManagerProps = {
  productId?: number | null;
  draftKey?: string;
  variantId?: number | null;
  images: ProductImageDto[];
  setImages: React.Dispatch<React.SetStateAction<ProductImageDto[]>>;
  onPersistedImageRemoved?: (image: ProductImageDto) => void;
  disabled?: boolean;
  title?: string;
  description?: string;
  emptyLabel?: string;
};

const PLACEHOLDER_IMAGE = "/images/item_placeholder.jpg";
let nextTemporaryImageId = -1;

export default function ProductImagesManager({
  productId = null,
  draftKey = "draft-product",
  variantId = null,
  images,
  setImages,
  onPersistedImageRemoved,
  disabled = false,
  title = "Product images",
  description = "Upload images to Firebase now. Ordering, primary selection, and removal stay local until you save the product.",
  emptyLabel = "No images uploaded yet.",
}: ProductImagesManagerProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [imagePendingRemoval, setImagePendingRemoval] =
    useState<ProductImageDto | null>(null);
  const [isRemovingImage, setIsRemovingImage] = useState(false);

  const orderedImages = useMemo(() => normalizeImages(images), [images]);
  const galleryItems = useMemo(
    () =>
      orderedImages.map((image) => ({
        id: image.id,
        imageUrl: image.imageUrl,
        altText: image.altText,
        isPrimary: image.isPrimary,
      })),
    [orderedImages],
  );

  const handleFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0 || uploading || disabled) {
      return;
    }

    setUploading(true);

    try {
      const nextImages = [...orderedImages];
      let uploadedCount = 0;

      for (const file of files) {
        const uploaded = await uploadProductImageToFirebase({
          file,
          productId: productId ?? draftKey,
          variantId,
        });

        nextImages.push({
          id: nextTemporaryImageId--,
          variantId,
          imageUrl: uploaded.imageUrl,
          storagePath: uploaded.storagePath,
          altText: buildAltTextFromFileName(file.name),
          sortOrder: nextImages.length,
          isPrimary: nextImages.length === 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        uploadedCount += 1;
      }

      setImages(normalizeImages(nextImages));
      toast.success(
        uploadedCount === 1
          ? "Image uploaded"
          : `${uploadedCount} images uploaded`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not upload image.",
      );
    } finally {
      setUploading(false);
    }
  };

  const setPrimaryImage = (imageId: number) => {
    if (disabled) {
      return;
    }

    setImages((current) => {
      const ordered = normalizeImages(current);
      const selectedIndex = ordered.findIndex((image) => image.id === imageId);

      if (selectedIndex <= 0) {
        return ordered;
      }

      const selectedImage = ordered[selectedIndex];
      const nextImages = [
        selectedImage,
        ...ordered.slice(0, selectedIndex),
        ...ordered.slice(selectedIndex + 1),
      ];

      return normalizeImages(nextImages);
    });
  };

  const moveImage = (imageId: number, direction: "left" | "right") => {
    if (disabled) {
      return;
    }

    setImages((current) => {
      const ordered = normalizeImages(current);
      const index = ordered.findIndex((image) => image.id === imageId);

      if (index < 0) {
        return ordered;
      }

      const targetIndex = direction === "left" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= ordered.length) {
        return ordered;
      }

      const nextImages = [...ordered];
      const [movedImage] = nextImages.splice(index, 1);
      nextImages.splice(targetIndex, 0, movedImage);
      return normalizeImages(nextImages);
    });
  };

  const removeImage = async (imageId: number) => {
    if (disabled) {
      return false;
    }

    const imageToRemove = orderedImages.find((image) => image.id === imageId);

    if (imageToRemove && imageToRemove.id < 0 && imageToRemove.storagePath) {
      try {
        await deleteProductImageFromFirebase(imageToRemove.storagePath);
      } catch {
        toast.error("Could not remove the uploaded file.");
        return false;
      }
    }

    if (imageToRemove && imageToRemove.id > 0) {
      onPersistedImageRemoved?.(imageToRemove);
    }

    setImages((current) =>
      normalizeImages(current.filter((image) => image.id !== imageId)),
    );
    return true;
  };

  const closeImageRemovalDialog = () => {
    if (isRemovingImage) {
      return;
    }

    setImagePendingRemoval(null);
  };

  const confirmImageRemoval = async () => {
    if (!imagePendingRemoval || isRemovingImage) {
      return;
    }

    setIsRemovingImage(true);

    try {
      const removed = await removeImage(imagePendingRemoval.id);

      if (removed) {
        setImagePendingRemoval(null);
      }
    } finally {
      setIsRemovingImage(false);
    }
  };

  return (
    <>
      <section className="space-y-5 border-t border-base-300 p-2">
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-base-content">{title}</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-base-content/65">
              {description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              id={inputId}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelection}
              disabled={disabled || uploading}
            />
            <label
              htmlFor={inputId}
              className={`btn btn-sm ${disabled || uploading ? "btn-disabled" : "btn-outline"}`}
            >
              {uploading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {uploading ? "Uploading..." : "Add images"}
            </label>
          </div>
        </div>

        <ProductImageGallery
          images={galleryItems}
          title={title}
          placeholderSrc={PLACEHOLDER_IMAGE}
        />

        {orderedImages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-base-300 bg-base-200/30 px-4 py-6 text-sm text-base-content/60">
            {emptyLabel}
          </div>
        ) : (
          <div className="space-y-3">
            {orderedImages.map((image, index) => (
              <div
                key={image.id}
                className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 sm:flex-row sm:items-center"
              >
                <div className="h-20 w-full overflow-hidden rounded-xl border border-base-300 bg-base-200 sm:w-28">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.imageUrl || PLACEHOLDER_IMAGE}
                    alt={image.altText || `${title} ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge border border-base-300 bg-base-100 px-3 py-2 text-xs font-medium text-base-content/70">
                      #{index + 1}
                    </span>
                    {image.isPrimary && (
                      <span className="badge border border-warning/20 bg-warning/10 px-3 py-2 text-xs font-medium text-base-content">
                        Primary
                      </span>
                    )}
                  </div>

                  <p className="mt-2 truncate text-sm font-medium text-base-content">
                    {image.altText?.trim() || "Untitled image"}
                  </p>
                  <p className="mt-1 truncate text-xs text-base-content/50">
                    {image.storagePath || image.imageUrl}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => moveImage(image.id, "left")}
                    disabled={disabled || index === 0}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Move up
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => moveImage(image.id, "right")}
                    disabled={disabled || index === orderedImages.length - 1}
                  >
                    <ArrowRight className="h-4 w-4" />
                    Move down
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setPrimaryImage(image.id)}
                    disabled={disabled || image.isPrimary}
                  >
                    <Star className="h-4 w-4" />
                    Make primary
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-error btn-sm"
                    onClick={() => setImagePendingRemoval(image)}
                    disabled={disabled || isRemovingImage}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmActionModal
        isOpen={imagePendingRemoval !== null}
        title="Remove image?"
        description={
          imagePendingRemoval?.id && imagePendingRemoval.id > 0
            ? "This image will be removed from the product the next time you save the editor."
            : "This uploaded draft image will be removed immediately."
        }
        confirmLabel="Remove image"
        cancelLabel="Keep image"
        tone="error"
        isSubmitting={isRemovingImage}
        onClose={closeImageRemovalDialog}
        onConfirm={confirmImageRemoval}
      />
    </>
  );
}

function normalizeImages(images: ProductImageDto[]) {
  const sorted = [...images].sort((left, right) => {
    if (left.isPrimary !== right.isPrimary) {
      return left.isPrimary ? -1 : 1;
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.id - right.id;
  });

  return sorted.map((image, index) => ({
    ...image,
    sortOrder: index,
    isPrimary: index === 0,
  }));
}

function buildAltTextFromFileName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}
