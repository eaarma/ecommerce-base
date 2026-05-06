export const HOME_PLACEHOLDER_IMAGE = "/images/item_placeholder.jpg";

export function getDisplayImageUrl(imageUrl: string | null | undefined) {
  const trimmedUrl = imageUrl?.trim();

  return trimmedUrl && trimmedUrl.length > 0
    ? trimmedUrl
    : HOME_PLACEHOLDER_IMAGE;
}

export function getBackgroundImageValue(imageUrl: string | null | undefined) {
  const displayImage = getDisplayImageUrl(imageUrl);

  return displayImage === HOME_PLACEHOLDER_IMAGE
    ? `url(${HOME_PLACEHOLDER_IMAGE})`
    : `url(${displayImage}), url(${HOME_PLACEHOLDER_IMAGE})`;
}
