export type StoreCustomizationHeaderMeta = {
  statusBadgeClassName: string | null;
  statusBadgeLabel: string | null;
  lastUpdatedLabel: string | null;
};

export type StoreCustomizationTabProps = {
  onHeaderMetaChange?: (meta: StoreCustomizationHeaderMeta) => void;
};

export const EMPTY_STORE_CUSTOMIZATION_HEADER_META: StoreCustomizationHeaderMeta =
  {
    statusBadgeClassName: null,
    statusBadgeLabel: null,
    lastUpdatedLabel: null,
  };

export const formatStoreCustomizationDateTime = (value?: string) => {
  if (!value) return "Not saved yet";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};
