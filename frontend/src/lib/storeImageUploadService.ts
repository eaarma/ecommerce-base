"use client";

import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { storage } from "@/lib/firebase";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

export type UploadedFirebaseStoreImageDto = {
  imageUrl: string;
  storagePath: string;
  fileName: string;
  contentType: string | null;
  size: number;
};

export type UploadStoreImageToFirebaseParams = {
  file: File;
  shopId: number | string;
  folder?: string;
};

export async function uploadStoreImageToFirebase({
  file,
  shopId,
  folder = "logos",
}: UploadStoreImageToFirebaseParams): Promise<UploadedFirebaseStoreImageDto> {
  assertClientRuntime();
  validateImageFile(file);

  const storagePath = buildStoragePath({
    fileName: file.name,
    shopId,
    folder,
  });
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type || undefined,
    cacheControl: "public,max-age=31536000,immutable",
  });

  const imageUrl = await getDownloadURL(storageRef);

  return {
    imageUrl,
    storagePath,
    fileName: file.name,
    contentType: file.type || null,
    size: file.size,
  };
}

export async function deleteStoreImageFromFirebase(storagePath: string) {
  assertClientRuntime();

  const normalizedStoragePath = storagePath.trim();
  if (!normalizedStoragePath) {
    return;
  }

  await deleteObject(ref(storage, normalizedStoragePath));
}

function assertClientRuntime() {
  if (typeof window === "undefined") {
    throw new Error("Firebase image uploads must run in the browser.");
  }
}

function validateImageFile(file: File) {
  if (!file) {
    throw new Error("Choose an image file to upload.");
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error(
      "Only JPG, PNG, WebP, GIF, AVIF, and SVG images are supported.",
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Images must be 10MB or smaller.");
  }
}

function buildStoragePath({
  fileName,
  shopId,
  folder,
}: {
  fileName: string;
  shopId: number | string;
  folder: string;
}) {
  const normalizedShopId = sanitizePathSegment(String(shopId));
  const normalizedFolder = sanitizePathSegment(folder) || "logos";
  const extension = extractExtension(fileName);
  const uniqueId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return ["stores", normalizedShopId, normalizedFolder, `${uniqueId}${extension}`].join(
    "/",
  );
}

function sanitizePathSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractExtension(fileName: string) {
  const match = /\.([a-z0-9]{1,10})$/i.exec(fileName);
  return match ? `.${match[1].toLowerCase()}` : "";
}
