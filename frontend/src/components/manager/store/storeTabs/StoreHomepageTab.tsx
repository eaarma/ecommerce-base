"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { ApiError } from "@/lib/api/axios";
import ConfirmActionModal from "@/components/common/ConfirmActionModal";
import { StorePageEditorSelectField as SelectField } from "@/components/manager/store/storePageEditor/StorePageEditorSelectField";
import { StorePageEditorTextField as TextField } from "@/components/manager/store/storePageEditor/StorePageEditorTextField";
import { StorePageEditorTextareaField as TextareaField } from "@/components/manager/store/storePageEditor/StorePageEditorTextareaField";
import {
  formatStoreCustomizationDateTime,
  type StoreCustomizationTabProps,
} from "@/components/manager/store/storeCustomizationHeader";
import { ManagerHomepageService } from "@/lib/managerHomepageService";
import { ManagerProductService } from "@/lib/managerProductService";
import { ManagerStoreService } from "@/lib/managerStoreService";
import {
  deleteStoreImageFromFirebase,
  uploadStoreImageToFirebase,
} from "@/lib/storeImageUploadService";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  HomepageCollectionBlockDto,
  HomepageConfigDto,
  HomepageFeaturedSelectionMode,
  HomepageHeroButtonPosition,
  HomepageHeroTextColorMode,
  HomepageValueCardDto,
  HomepageValueIconKey,
  UpdateHomepageConfigRequestDto,
} from "@/types/homepage";
import type { ProductDto, ProductStatus } from "@/types/product";

type CollectionBlockForm = {
  badge: string;
  title: string;
  description: string;
  productId: string;
};

type ValueCardForm = {
  title: string;
  description: string;
  iconKey: HomepageValueIconKey;
};

type HomepageForm = {
  heroEnabled: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonLink: string;
  heroButtonPosition: HomepageHeroButtonPosition;
  heroImageUrl: string;
  heroTextColorMode: HomepageHeroTextColorMode;
  heroCustomTextColor: string;
  heroOverlayStrength: string;
  featuredEnabled: boolean;
  featuredTitle: string;
  featuredSelectionMode: HomepageFeaturedSelectionMode;
  featuredProductIds: number[];
  featuredMaxItems: string;
  spotlightEnabled: boolean;
  spotlightProductId: string;
  spotlightBadgeTitle: string;
  collectionEnabled: boolean;
  collectionBlocks: CollectionBlockForm[];
  valueSectionEnabled: boolean;
  valueCards: ValueCardForm[];
  ctaEnabled: boolean;
  ctaTitle: string;
  ctaDescription: string;
};

type HomepageFieldErrors = Partial<Record<string, string>>;

const HOMEPAGE_BUTTON_POSITION_OPTIONS: Array<{
  value: HomepageHeroButtonPosition;
  label: string;
}> = [
  { value: "LEFT", label: "Left" },
  { value: "CENTER", label: "Center" },
  { value: "RIGHT", label: "Right" },
];

const HERO_TEXT_COLOR_MODE_OPTIONS: Array<{
  value: HomepageHeroTextColorMode;
  label: string;
  description: string;
}> = [
  {
    value: "AUTO",
    label: "Auto",
    description: "Recommended default for image-based heroes.",
  },
  {
    value: "LIGHT",
    label: "Light",
    description: "Use light text on top of darker or busier images.",
  },
  {
    value: "DARK",
    label: "Dark",
    description: "Use dark text on top of bright, airy hero images.",
  },
  {
    value: "CUSTOM",
    label: "Custom",
    description: "Choose a specific hero text color manually.",
  },
];

const FEATURED_SELECTION_MODE_OPTIONS: Array<{
  value: HomepageFeaturedSelectionMode;
  label: string;
  description: string;
}> = [
  {
    value: "MANUAL",
    label: "Manual",
    description: "Managers choose the featured products directly.",
  },
  {
    value: "RANDOM",
    label: "Random",
    description: "The storefront rotates featured products automatically.",
  },
  {
    value: "LATEST",
    label: "Latest",
    description: "The newest public products are shown first.",
  },
];

const VALUE_ICON_OPTIONS: Array<{
  value: HomepageValueIconKey;
  label: string;
}> = [
  { value: "QUALITY", label: "Quality" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "SECURE_PAYMENT", label: "Secure payment" },
  { value: "SUPPORT", label: "Support" },
  { value: "HANDMADE", label: "Handmade" },
  { value: "SUSTAINABLE", label: "Sustainable" },
];

const MAX_VALUE_CARDS = 4;

const PUBLIC_PRODUCT_STATUSES: ProductStatus[] = ["ACTIVE", "OUT_OF_STOCK"];

const emptyValueCard = (): ValueCardForm => ({
  title: "",
  description: "",
  iconKey: "QUALITY",
});

const normalizeOptionalString = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const isValidHomepageLink = (value: string) => {
  if (!value.trim()) {
    return true;
  }

  if (value.trim().startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const toCollectionBlockForm = (
  block: HomepageCollectionBlockDto | undefined,
): CollectionBlockForm => ({
  badge: block?.badge ?? "",
  title: block?.title ?? "",
  description: block?.description ?? "",
  productId: block?.productId != null ? String(block.productId) : "",
});

const normalizeCollectionBlocks = (
  blocks: HomepageCollectionBlockDto[],
): CollectionBlockForm[] =>
  Array.from({ length: 4 }, (_, index) => toCollectionBlockForm(blocks[index]));

const toValueCardForm = (
  card: HomepageValueCardDto | undefined,
): ValueCardForm => ({
  title: card?.title ?? "",
  description: card?.description ?? "",
  iconKey: card?.iconKey ?? "QUALITY",
});

const normalizeValueCards = (cards: HomepageValueCardDto[]): ValueCardForm[] =>
  cards.slice(0, MAX_VALUE_CARDS).map((card) => toValueCardForm(card));

const toHomepageForm = (
  config?: HomepageConfigDto | UpdateHomepageConfigRequestDto | null,
): HomepageForm => {
  const source = config ?? DEFAULT_HOMEPAGE_CONFIG;

  return {
    heroEnabled: source.heroEnabled,
    heroTitle: source.heroTitle ?? "",
    heroSubtitle: source.heroSubtitle ?? "",
    heroButtonText: source.heroButtonText ?? "",
    heroButtonLink: source.heroButtonLink ?? "",
    heroButtonPosition: source.heroButtonPosition,
    heroImageUrl: source.heroImageUrl ?? "",
    heroTextColorMode: source.heroTextColorMode,
    heroCustomTextColor: source.heroCustomTextColor ?? "",
    heroOverlayStrength: String(source.heroOverlayStrength),
    featuredEnabled: source.featuredEnabled,
    featuredTitle: source.featuredTitle ?? "",
    featuredSelectionMode: source.featuredSelectionMode,
    featuredProductIds: [...source.featuredProductIds],
    featuredMaxItems: String(source.featuredMaxItems),
    spotlightEnabled: source.spotlightEnabled,
    spotlightProductId:
      source.spotlightProductId != null
        ? String(source.spotlightProductId)
        : "",
    spotlightBadgeTitle: source.spotlightBadgeTitle ?? "",
    collectionEnabled: source.collectionEnabled,
    collectionBlocks: normalizeCollectionBlocks(source.collectionBlocks),
    valueSectionEnabled: source.valueSectionEnabled,
    valueCards: normalizeValueCards(source.valueCards),
    ctaEnabled: source.ctaEnabled,
    ctaTitle: source.ctaTitle ?? "",
    ctaDescription: source.ctaDescription ?? "",
  };
};

const serializeHomepageForm = (form: HomepageForm) =>
  JSON.stringify({
    ...form,
    featuredProductIds: [...form.featuredProductIds],
    collectionBlocks: form.collectionBlocks.map((block) => ({ ...block })),
    valueCards: form.valueCards.map((card) => ({ ...card })),
  });

const formatProductStatus = (status: ProductStatus) =>
  status.replace(/_/g, " ").toLowerCase();

const getStatusBadgeClassName = (status: ProductStatus) => {
  if (status === "ACTIVE") {
    return "badge-success";
  }

  if (status === "OUT_OF_STOCK") {
    return "badge-warning";
  }

  return "badge-neutral";
};

function validateHomepageForm(
  form: HomepageForm,
  visibleProductIds: Set<number>,
): HomepageFieldErrors {
  const nextErrors: HomepageFieldErrors = {};

  if (!isValidHomepageLink(form.heroButtonLink)) {
    nextErrors.heroButtonLink =
      "Use a site-relative link like /products or a valid http:// or https:// URL.";
  }

  if (!isValidHomepageLink(form.heroImageUrl)) {
    nextErrors.heroImageUrl =
      "Use a site-relative path like /hero.png or a valid http:// or https:// URL.";
  }

  if (
    form.heroTextColorMode === "CUSTOM" &&
    !/^#(?:[0-9a-f]{6}|[0-9a-f]{3})$/i.test(form.heroCustomTextColor.trim())
  ) {
    nextErrors.heroCustomTextColor =
      "Use a valid hex color such as #ffffff or #1f2937.";
  }

  const heroOverlayStrength = Number(form.heroOverlayStrength);
  if (
    !Number.isInteger(heroOverlayStrength) ||
    heroOverlayStrength < 0 ||
    heroOverlayStrength > 100
  ) {
    nextErrors.heroOverlayStrength =
      "Overlay strength must be a whole number between 0 and 100.";
  }

  if (
    form.featuredEnabled &&
    form.featuredSelectionMode === "MANUAL" &&
    form.featuredProductIds.length === 0
  ) {
    nextErrors.featuredProductIds =
      "Add at least one product when manual featured selection is enabled.";
  }

  if (
    form.featuredProductIds.some(
      (productId) => !visibleProductIds.has(productId),
    )
  ) {
    nextErrors.featuredProductIds =
      "Featured products must use active or out-of-stock items.";
  }

  const featuredMaxItems = Number(form.featuredMaxItems);
  if (!Number.isInteger(featuredMaxItems) || featuredMaxItems < 1) {
    nextErrors.featuredMaxItems =
      "Max items shown must be a whole number of 1 or more.";
  }

  const spotlightProductId = Number(form.spotlightProductId);
  if (
    form.spotlightProductId.trim() &&
    (!Number.isInteger(spotlightProductId) ||
      !visibleProductIds.has(spotlightProductId))
  ) {
    nextErrors.spotlightProductId =
      "Choose an active or out-of-stock product for the spotlight section.";
  }

  form.collectionBlocks.forEach((block, index) => {
    const fieldPrefix = `collectionBlocks.${index}`;
    const productId = Number(block.productId);

    if (
      block.productId.trim() &&
      (!Number.isInteger(productId) || !visibleProductIds.has(productId))
    ) {
      nextErrors[`${fieldPrefix}.productId`] =
        "Choose an active or out-of-stock product for this collection block.";
    }
  });

  form.valueCards.forEach((card, index) => {
    if (!VALUE_ICON_OPTIONS.some((option) => option.value === card.iconKey)) {
      nextErrors[`valueCards.${index}.iconKey`] = "Choose a valid icon.";
    }
  });

  if (form.valueCards.length > MAX_VALUE_CARDS) {
    nextErrors.valueCards = `Use no more than ${MAX_VALUE_CARDS} trust cards.`;
  }

  return nextErrors;
}

export default function StoreHomepageTab({
  onHeaderMetaChange,
}: StoreCustomizationTabProps) {
  const [homepageConfig, setHomepageConfig] =
    useState<HomepageConfigDto | null>(null);
  const [shopId, setShopId] = useState<number | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [form, setForm] = useState<HomepageForm>(() =>
    toHomepageForm(DEFAULT_HOMEPAGE_CONFIG),
  );
  const [initialForm, setInitialForm] = useState<HomepageForm>(() =>
    toHomepageForm(DEFAULT_HOMEPAGE_CONFIG),
  );
  const [fieldErrors, setFieldErrors] = useState<HomepageFieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [isHeroRemovalConfirmOpen, setIsHeroRemovalConfirmOpen] = useState(false);
  const [isRemovingHeroImage, setIsRemovingHeroImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingHeroStoragePath, setPendingHeroStoragePath] = useState<
    string | null
  >(null);
  const heroImageInputRef = useRef<HTMLInputElement | null>(null);
  const pendingHeroStoragePathRef = useRef<string | null>(null);

  const applyLoadedData = useCallback(
    (
      nextHomepageConfig: HomepageConfigDto,
      nextProducts: ProductDto[],
      nextShopId: number,
    ) => {
      const nextForm = toHomepageForm(nextHomepageConfig);
      const previousPendingHeroStoragePath =
        pendingHeroStoragePathRef.current?.trim();

      if (previousPendingHeroStoragePath) {
        void deleteStoreImageFromFirebase(previousPendingHeroStoragePath).catch(
          () => undefined,
        );
      }

      setHomepageConfig(nextHomepageConfig);
      setShopId(nextShopId);
      setProducts(nextProducts);
      setForm(nextForm);
      setInitialForm(nextForm);
      setFieldErrors({});
      setPendingHeroStoragePath(null);
      pendingHeroStoragePathRef.current = null;
    },
    [],
  );

  const loadHomepageWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextHomepageConfig, nextProducts, nextShop] = await Promise.all([
        ManagerHomepageService.getHomepageConfig(),
        ManagerProductService.getAllProducts(),
        ManagerStoreService.getShop(),
      ]);

      applyLoadedData(nextHomepageConfig, nextProducts, nextShop.id);
    } catch (loadError) {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Could not load homepage settings. Please sign in with a staff account.",
      );
    } finally {
      setLoading(false);
    }
  }, [applyLoadedData]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      ManagerHomepageService.getHomepageConfig(),
      ManagerProductService.getAllProducts(),
      ManagerStoreService.getShop(),
    ])
      .then(([nextHomepageConfig, nextProducts, nextShop]) => {
        if (!cancelled) {
          applyLoadedData(nextHomepageConfig, nextProducts, nextShop.id);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "Could not load homepage settings. Please sign in with a staff account.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applyLoadedData]);

  const visibleProducts = useMemo(
    () =>
      [...products]
        .filter((product) => PUBLIC_PRODUCT_STATUSES.includes(product.status))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [products],
  );

  const visibleProductIds = useMemo(
    () => new Set(visibleProducts.map((product) => product.id)),
    [visibleProducts],
  );

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const isDirty = useMemo(
    () => serializeHomepageForm(form) !== serializeHomepageForm(initialForm),
    [form, initialForm],
  );

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    onHeaderMetaChange?.({
      statusBadgeClassName: isDirty ? "badge-warning" : "badge-ghost",
      statusBadgeLabel: isDirty ? "Unsaved changes" : "Saved",
      lastUpdatedLabel: homepageConfig
        ? `Last updated ${formatStoreCustomizationDateTime(homepageConfig.updatedAt)}`
        : null,
    });
  }, [homepageConfig, isDirty, onHeaderMetaChange]);

  useEffect(() => {
    pendingHeroStoragePathRef.current = pendingHeroStoragePath;
  }, [pendingHeroStoragePath]);

  useEffect(() => {
    return () => {
      const currentPendingHeroStoragePath =
        pendingHeroStoragePathRef.current?.trim();

      if (!currentPendingHeroStoragePath) {
        return;
      }

      void deleteStoreImageFromFirebase(currentPendingHeroStoragePath).catch(
        () => undefined,
      );
    };
  }, []);

  const selectedFeaturedMode =
    FEATURED_SELECTION_MODE_OPTIONS.find(
      (option) => option.value === form.featuredSelectionMode,
    ) ?? FEATURED_SELECTION_MODE_OPTIONS[0];

  const featuredSelectedProducts = form.featuredProductIds
    .map((productId) => productsById.get(productId) ?? null)
    .filter((product): product is ProductDto => product !== null);

  const featuredMissingProductIds = form.featuredProductIds.filter(
    (productId) => !productsById.has(productId),
  );

  const spotlightProduct =
    form.spotlightProductId.trim() &&
    Number.isInteger(Number(form.spotlightProductId))
      ? (productsById.get(Number(form.spotlightProductId)) ?? null)
      : null;

  const collectionLinkedCount = form.collectionBlocks.filter((block) =>
    block.productId.trim(),
  ).length;

  const valueCardCount = form.valueCards.length;

  const updateField = <Key extends keyof HomepageForm>(
    fieldName: Key,
    value: HomepageForm[Key],
  ) => {
    setForm((current) => ({
      ...current,
      [fieldName]: value,
    }));

    setError(null);
    setFieldErrors((current) => ({
      ...current,
      [fieldName as string]: undefined,
    }));
  };

  const updateCollectionBlock = <Key extends keyof CollectionBlockForm>(
    index: number,
    fieldName: Key,
    value: CollectionBlockForm[Key],
  ) => {
    setForm((current) => ({
      ...current,
      collectionBlocks: current.collectionBlocks.map((block, blockIndex) =>
        blockIndex === index
          ? {
              ...block,
              [fieldName]: value,
            }
          : block,
      ),
    }));

    setError(null);
    setFieldErrors((current) => ({
      ...current,
      [`collectionBlocks.${index}.${fieldName}`]: undefined,
    }));
  };

  const updateValueCard = <Key extends keyof ValueCardForm>(
    index: number,
    fieldName: Key,
    value: ValueCardForm[Key],
  ) => {
    setForm((current) => ({
      ...current,
      valueCards: current.valueCards.map((card, cardIndex) =>
        cardIndex === index
          ? {
              ...card,
              [fieldName]: value,
            }
          : card,
      ),
    }));

    setError(null);
    setFieldErrors((current) => ({
      ...current,
      [`valueCards.${index}.${fieldName}`]: undefined,
      valueCards: undefined,
    }));
  };

  const addFeaturedProduct = (productId: number) => {
    setForm((current) => ({
      ...current,
      featuredProductIds: current.featuredProductIds.includes(productId)
        ? current.featuredProductIds
        : [...current.featuredProductIds, productId],
    }));

    setError(null);
    setFieldErrors((current) => ({
      ...current,
      featuredProductIds: undefined,
    }));
  };

  const removeFeaturedProduct = (productId: number) => {
    setForm((current) => ({
      ...current,
      featuredProductIds: current.featuredProductIds.filter(
        (currentProductId) => currentProductId !== productId,
      ),
    }));

    setError(null);
    setFieldErrors((current) => ({
      ...current,
      featuredProductIds: undefined,
    }));
  };

  const addValueCard = () => {
    setForm((current) => ({
      ...current,
      valueCards:
        current.valueCards.length < MAX_VALUE_CARDS
          ? [...current.valueCards, emptyValueCard()]
          : current.valueCards,
    }));

    setError(null);
    setFieldErrors((current) => ({
      ...current,
      valueCards: undefined,
    }));
  };

  const removeValueCard = (index: number) => {
    setForm((current) => ({
      ...current,
      valueCards: current.valueCards.filter(
        (_, cardIndex) => cardIndex !== index,
      ),
    }));

    setError(null);
    setFieldErrors((current) => ({
      ...current,
      valueCards: undefined,
    }));
  };

  const clearPendingHeroUpload = useCallback(async () => {
    const currentPendingHeroStoragePath =
      pendingHeroStoragePathRef.current?.trim();

    if (!currentPendingHeroStoragePath) {
      setPendingHeroStoragePath(null);
      pendingHeroStoragePathRef.current = null;
      return;
    }

    pendingHeroStoragePathRef.current = null;
    setPendingHeroStoragePath(null);

    try {
      await deleteStoreImageFromFirebase(currentPendingHeroStoragePath);
    } catch {
      // Ignore cleanup failures for temporary uploads.
    }
  }, []);

  const handleHeroImagePickerOpen = () => {
    if (heroUploading || submitting) {
      return;
    }

    heroImageInputRef.current?.click();
  };

  const handleHeroImageFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (shopId == null) {
      setError("Store details are still loading. Please try the upload again.");
      return;
    }

    setHeroUploading(true);
    setError(null);
    setFieldErrors((current) => ({
      ...current,
      heroImageUrl: undefined,
    }));

    try {
      const uploadedHeroImage = await uploadStoreImageToFirebase({
        file,
        shopId,
        folder: "homepage-hero",
      });

      const previousPendingHeroStoragePath = pendingHeroStoragePathRef.current;
      pendingHeroStoragePathRef.current = uploadedHeroImage.storagePath;
      setPendingHeroStoragePath(uploadedHeroImage.storagePath);

      if (previousPendingHeroStoragePath) {
        void deleteStoreImageFromFirebase(previousPendingHeroStoragePath).catch(
          () => undefined,
        );
      }

      updateField("heroImageUrl", uploadedHeroImage.imageUrl);
      toast.success("Hero image uploaded");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload the hero image. Please try again.",
      );
    } finally {
      setHeroUploading(false);
    }
  };

  const handleRemoveHeroImage = async () => {
    if (isRemovingHeroImage) {
      return;
    }

    setIsRemovingHeroImage(true);

    try {
      await clearPendingHeroUpload();
      updateField("heroImageUrl", "");
      setIsHeroRemovalConfirmOpen(false);
    } finally {
      setIsRemovingHeroImage(false);
    }
  };

  const handleReset = () => {
    void clearPendingHeroUpload();
    setForm(initialForm);
    setFieldErrors({});
    setError(null);
  };

  const buildRequestPayload = (): UpdateHomepageConfigRequestDto => ({
    heroEnabled: form.heroEnabled,
    heroTitle: normalizeOptionalString(form.heroTitle),
    heroSubtitle: normalizeOptionalString(form.heroSubtitle),
    heroButtonText: normalizeOptionalString(form.heroButtonText),
    heroButtonLink: normalizeOptionalString(form.heroButtonLink),
    heroButtonPosition: form.heroButtonPosition,
    heroImageUrl: normalizeOptionalString(form.heroImageUrl),
    heroTextColorMode: form.heroTextColorMode,
    heroCustomTextColor:
      form.heroTextColorMode === "CUSTOM"
        ? normalizeOptionalString(form.heroCustomTextColor)
        : null,
    heroOverlayStrength: Number(form.heroOverlayStrength),
    featuredEnabled: form.featuredEnabled,
    featuredTitle: normalizeOptionalString(form.featuredTitle),
    featuredSelectionMode: form.featuredSelectionMode,
    featuredProductIds: form.featuredProductIds,
    featuredMaxItems: Number(form.featuredMaxItems),
    spotlightEnabled: form.spotlightEnabled,
    spotlightProductId: form.spotlightProductId.trim()
      ? Number(form.spotlightProductId)
      : null,
    spotlightBadgeTitle: normalizeOptionalString(form.spotlightBadgeTitle),
    collectionEnabled: form.collectionEnabled,
    collectionBlocks: form.collectionBlocks.map((block) => ({
      badge: normalizeOptionalString(block.badge),
      title: normalizeOptionalString(block.title),
      description: normalizeOptionalString(block.description),
      productId: block.productId.trim() ? Number(block.productId) : null,
    })),
    valueSectionEnabled: form.valueSectionEnabled,
    valueCards: form.valueCards.map((card) => ({
      title: normalizeOptionalString(card.title),
      description: normalizeOptionalString(card.description),
      iconKey: card.iconKey,
    })),
    ctaEnabled: form.ctaEnabled,
    ctaTitle: normalizeOptionalString(form.ctaTitle),
    ctaDescription: normalizeOptionalString(form.ctaDescription),
  });
  const isAssetUploading = heroUploading;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateHomepageForm(form, visibleProductIds);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("Please fix the highlighted homepage fields before saving.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updatedHomepageConfig =
        await ManagerHomepageService.updateHomepageConfig(
          buildRequestPayload(),
        );
      const nextForm = toHomepageForm(updatedHomepageConfig);

      setHomepageConfig(updatedHomepageConfig);
      setForm(nextForm);
      setInitialForm(nextForm);
      setFieldErrors({});
      setPendingHeroStoragePath(null);
      pendingHeroStoragePathRef.current = null;

      toast.success("Homepage settings updated");
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : "Could not save homepage settings. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="store-panel-homepage"
      role="tabpanel"
      aria-labelledby="store-tab-homepage"
      className="space-y-0 space-x-2"
    >
      {loading && (
        <div className="rounded-lg border border-base-300 bg-base-100 px-4 py-10 text-sm text-base-content/60">
          Loading homepage settings...
        </div>
      )}

      {!loading && !homepageConfig && (
        <div className="rounded-lg border border-base-300 bg-base-100 px-4 py-6">
          <p className="text-sm text-error">
            {error ?? "Could not load homepage settings."}
          </p>
          <button
            type="button"
            className="btn btn-outline btn-sm mt-4"
            onClick={() => void loadHomepageWorkspace()}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && homepageConfig && (
        <div className="grid xl:grid-cols-[minmax(0,1fr)_340px]">
          <form onSubmit={handleSubmit} className="space-y-0">
            {error && (
              <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            <SettingsCard
              title="Hero"
              description="Top-of-page messaging, action text, and hero media."
            >
              <ToggleField
                label="Show hero section"
                checked={form.heroEnabled}
                onChange={(checked) => updateField("heroEnabled", checked)}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Title"
                  value={form.heroTitle}
                  onChange={(value) => updateField("heroTitle", value)}
                  maxLength={255}
                  placeholder="A warmer, easier storefront..."
                />
                <SelectField
                  label="Button position"
                  value={form.heroButtonPosition}
                  onChange={(value) =>
                    updateField(
                      "heroButtonPosition",
                      value as HomepageHeroButtonPosition,
                    )
                  }
                  options={HOMEPAGE_BUTTON_POSITION_OPTIONS}
                />
              </div>

              <TextareaField
                label="Subtitle"
                value={form.heroSubtitle}
                onChange={(value) => updateField("heroSubtitle", value)}
                rows={4}
                maxLength={1000}
                placeholder="Browse a curated catalog..."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Button text"
                  value={form.heroButtonText}
                  onChange={(value) => updateField("heroButtonText", value)}
                  maxLength={120}
                  placeholder="Browse products"
                />
                <TextField
                  label="Button link"
                  value={form.heroButtonLink}
                  onChange={(value) => updateField("heroButtonLink", value)}
                  maxLength={500}
                  placeholder="/products"
                  error={fieldErrors.heroButtonLink}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="form-control">
                  <span className="label-text mb-2">Hero image</span>
                  <div className="rounded-2xl border border-base-300 bg-base-200/25 p-4">
                    <div className="space-y-4">
                      <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100">
                        {form.heroImageUrl.trim() ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={form.heroImageUrl.trim()}
                            alt="Homepage hero"
                            className="aspect-[16/9] w-full object-cover"
                          />
                        ) : (
                          <div className="flex aspect-[16/9] items-center justify-center px-4 text-center text-sm text-base-content/55">
                            No hero image selected yet.
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={handleHeroImagePickerOpen}
                          disabled={isAssetUploading || submitting}
                        >
                          {heroUploading ? "Uploading..." : "Add hero image"}
                        </button>

                        {form.heroImageUrl.trim() ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setIsHeroRemovalConfirmOpen(true)}
                            disabled={
                              isAssetUploading || submitting || isRemovingHeroImage
                            }
                          >
                            Remove hero image
                          </button>
                        ) : null}
                      </div>

                      <p className="text-sm text-base-content/60">
                        Upload JPG, PNG, WebP, GIF, AVIF, or SVG files up to
                        10MB. Save the homepage to keep the new hero image URL
                        on the homepage config.
                      </p>
                    </div>
                  </div>
                  <input
                    ref={heroImageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
                    className="hidden"
                    onChange={handleHeroImageFileChange}
                  />
                  {fieldErrors.heroImageUrl ? (
                    <span className="mt-1 text-sm text-error">
                      {fieldErrors.heroImageUrl}
                    </span>
                  ) : null}
                </div>
                <NumberField
                  label="Overlay strength"
                  value={form.heroOverlayStrength}
                  onChange={(value) =>
                    updateField("heroOverlayStrength", value)
                  }
                  min={0}
                  max={100}
                  error={fieldErrors.heroOverlayStrength}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Text color mode"
                  value={form.heroTextColorMode}
                  onChange={(value) =>
                    updateField(
                      "heroTextColorMode",
                      value as HomepageHeroTextColorMode,
                    )
                  }
                  options={HERO_TEXT_COLOR_MODE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />
                <ColorField
                  label="Custom text color"
                  value={form.heroCustomTextColor}
                  onChange={(value) =>
                    updateField("heroCustomTextColor", value)
                  }
                  disabled={form.heroTextColorMode !== "CUSTOM"}
                  error={fieldErrors.heroCustomTextColor}
                />
              </div>

              <div className="rounded-2xl border border-base-300 bg-base-200/25 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  Hero preview
                </p>
                <div className="mt-3 overflow-hidden rounded-2xl border border-base-300 bg-base-100">
                  <div
                    className="relative min-h-[180px] bg-cover bg-center p-5"
                    style={{
                      backgroundImage: `url(${form.heroImageUrl.trim() || "/hero_placeholder.png"})`,
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `linear-gradient(90deg, rgba(15, 23, 42, ${(Math.min(100, Math.max(0, Number(form.heroOverlayStrength) || 0)) / 100).toFixed(2)}) 0%, rgba(15, 23, 42, ${(Math.min(100, Math.max(0, Number(form.heroOverlayStrength) || 0)) / 250).toFixed(2)}) 38%, rgba(15, 23, 42, 0) 72%)`,
                      }}
                    />
                    <div className="relative z-10 max-w-md space-y-3">
                      <p
                        className={`text-2xl font-semibold leading-tight ${getHeroPreviewTitleClassName(form.heroTextColorMode)}`}
                        style={getHeroPreviewTextStyle(form)}
                      >
                        {form.heroTitle.trim() || "Homepage hero title"}
                      </p>
                      <p
                        className={`text-sm leading-6 ${getHeroPreviewSubtitleClassName(form.heroTextColorMode)}`}
                        style={getHeroPreviewTextStyle(form)}
                      >
                        {form.heroSubtitle.trim() ||
                          "Preview how hero text treatment behaves on the welcome image."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SettingsCard>

            <SettingsCard
              title="Featured products"
              description="Control the featured row without changing the overall homepage layout."
            >
              <ToggleField
                label="Show featured products section"
                checked={form.featuredEnabled}
                onChange={(checked) => updateField("featuredEnabled", checked)}
              />

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                <TextField
                  label="Section title"
                  value={form.featuredTitle}
                  onChange={(value) => updateField("featuredTitle", value)}
                  maxLength={255}
                  placeholder="Featured picks"
                />
                <NumberField
                  label="Max items shown"
                  value={form.featuredMaxItems}
                  onChange={(value) => updateField("featuredMaxItems", value)}
                  min={1}
                  max={24}
                  error={fieldErrors.featuredMaxItems}
                />
              </div>

              <SelectField
                label="Selection mode"
                value={form.featuredSelectionMode}
                onChange={(value) =>
                  updateField(
                    "featuredSelectionMode",
                    value as HomepageFeaturedSelectionMode,
                  )
                }
                options={FEATURED_SELECTION_MODE_OPTIONS}
              />

              <div className="rounded-2xl border border-base-300 bg-base-200/45 p-4 mt-2">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  Current mode
                </p>
                <p className="mt-1 text-lg font-semibold text-base-content">
                  {selectedFeaturedMode.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-base-content/65">
                  {selectedFeaturedMode.description}
                </p>
              </div>

              <ProductMultiPicker
                label="Selected products"
                helperText={
                  form.featuredSelectionMode === "MANUAL"
                    ? "These products are used when the featured section is set to Manual."
                    : "Manual picks stay saved here so the section is ready if you switch back to Manual later."
                }
                selectedProducts={featuredSelectedProducts}
                missingProductIds={featuredMissingProductIds}
                availableProducts={visibleProducts}
                selectedProductIds={form.featuredProductIds}
                onAddProduct={addFeaturedProduct}
                onRemoveProduct={removeFeaturedProduct}
                error={fieldErrors.featuredProductIds}
                disabled={submitting}
              />
            </SettingsCard>

            <SettingsCard
              title="Spotlight product"
              description="Control the large spotlight card that sits alongside the collection grid."
            >
              <ToggleField
                label="Show spotlight product"
                checked={form.spotlightEnabled}
                onChange={(checked) => updateField("spotlightEnabled", checked)}
              />

              <ProductSelectField
                label="Selected product"
                value={form.spotlightProductId}
                onChange={(value) => updateField("spotlightProductId", value)}
                products={visibleProducts}
                allProductsById={productsById}
                error={fieldErrors.spotlightProductId}
                placeholder="No spotlight product selected"
              />

              <div></div>
              <TextField
                label="Badge title override"
                value={form.spotlightBadgeTitle}
                onChange={(value) => updateField("spotlightBadgeTitle", value)}
                maxLength={120}
                placeholder="Store spotlight"
              />
            </SettingsCard>

            <SettingsCard
              title="Collection grid"
              description="These four blocks stay fixed in the layout, but their copy and linked products can change."
            >
              <ToggleField
                label="Show collection grid"
                checked={form.collectionEnabled}
                onChange={(checked) =>
                  updateField("collectionEnabled", checked)
                }
              />

              <div className="space-y-4">
                {form.collectionBlocks.map((block, index) => (
                  <div
                    key={`collection-block-${index}`}
                    className="rounded-2xl border border-base-300 bg-base-200/30 p-4"
                  >
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-base-content">
                        Block {index + 1}
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <TextField
                        label="Badge"
                        value={block.badge}
                        onChange={(value) =>
                          updateCollectionBlock(index, "badge", value)
                        }
                        maxLength={120}
                        placeholder="Just in"
                      />
                      <TextField
                        label="Title"
                        value={block.title}
                        onChange={(value) =>
                          updateCollectionBlock(index, "title", value)
                        }
                        maxLength={180}
                        placeholder="Fresh arrivals"
                      />
                    </div>

                    <div className="mt-2">
                      <TextareaField
                        label="Description"
                        value={block.description}
                        onChange={(value) =>
                          updateCollectionBlock(index, "description", value)
                        }
                        rows={3}
                        maxLength={500}
                        placeholder="Discover what is new in store"
                      />
                    </div>

                    <ProductSelectField
                      label="Linked product"
                      value={block.productId}
                      onChange={(value) =>
                        updateCollectionBlock(index, "productId", value)
                      }
                      products={visibleProducts}
                      allProductsById={productsById}
                      error={fieldErrors[`collectionBlocks.${index}.productId`]}
                      placeholder="No linked product"
                    />
                  </div>
                ))}
              </div>
            </SettingsCard>

            <SettingsCard
              title="Trust / value section"
              description="Editable cards that explain why this store feels reliable, useful, or distinctive."
            >
              <ToggleField
                label="Show trust / value section"
                checked={form.valueSectionEnabled}
                onChange={(checked) =>
                  updateField("valueSectionEnabled", checked)
                }
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-base-content/60">
                  Use up to {MAX_VALUE_CARDS} cards. The storefront layout stays
                  fixed.
                </p>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={addValueCard}
                  disabled={form.valueCards.length >= MAX_VALUE_CARDS}
                >
                  <Plus className="h-4 w-4" />
                  Add card
                </button>
              </div>

              {fieldErrors.valueCards && (
                <p className="text-sm text-error">{fieldErrors.valueCards}</p>
              )}

              {form.valueCards.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-4 py-4 text-sm text-base-content/55">
                  No trust cards added yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {form.valueCards.map((card, index) => (
                    <div
                      key={`value-card-${index}`}
                      className="rounded-2xl border border-base-300 bg-base-200/30 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-base-content">
                          Card {index + 1}
                        </p>
                        <button
                          type="button"
                          className="btn btn-outline btn-error btn-xs"
                          onClick={() => removeValueCard(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <TextField
                          label="Title"
                          value={card.title}
                          onChange={(value) =>
                            updateValueCard(index, "title", value)
                          }
                          maxLength={180}
                          placeholder="Reliable service"
                        />
                        <SelectField
                          label="Icon"
                          value={card.iconKey}
                          onChange={(value) =>
                            updateValueCard(
                              index,
                              "iconKey",
                              value as HomepageValueIconKey,
                            )
                          }
                          options={VALUE_ICON_OPTIONS}
                          error={fieldErrors[`valueCards.${index}.iconKey`]}
                        />
                      </div>

                      <div className="mt-2">
                        <TextareaField
                          label="Description"
                          value={card.description}
                          onChange={(value) =>
                            updateValueCard(index, "description", value)
                          }
                          rows={3}
                          maxLength={500}
                          placeholder="Clear stock visibility, consistent product details..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SettingsCard>

            <SettingsCard
              title="Final CTA"
              description="The two CTA buttons stay fixed as Browse Products and Contact Us. This section only changes the headline and supporting copy."
            >
              <ToggleField
                label="Show final CTA section"
                checked={form.ctaEnabled}
                onChange={(checked) => updateField("ctaEnabled", checked)}
              />

              <TextField
                label="Title"
                value={form.ctaTitle}
                onChange={(value) => updateField("ctaTitle", value)}
                maxLength={255}
                placeholder="Ready to browse the catalog..."
              />

              <div className="mt-2">
                <TextareaField
                  label="Description"
                  value={form.ctaDescription}
                  onChange={(value) => updateField("ctaDescription", value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Keep exploring products, or head straight to the contact page..."
                />
              </div>
            </SettingsCard>

            <div className="flex flex-col-reverse gap-3 mt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleReset}
                disabled={!isDirty || submitting || isAssetUploading}
              >
                Reset changes
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!isDirty || submitting || isAssetUploading}
              >
                {submitting ? "Saving..." : "Save homepage"}
              </button>
            </div>
          </form>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Layout snapshot
              </p>
              <h5 className="mt-2 text-lg font-semibold text-base-content">
                {form.heroTitle.trim() || "Homepage hero title"}
              </h5>
              <p className="mt-2 text-sm leading-6 text-base-content/65">
                {form.heroSubtitle.trim() ||
                  "Hero subtitle, featured rows, spotlight content, and trust cards all stay inside the fixed homepage layout."}
              </p>

              <div className="mt-5 space-y-3 text-sm text-base-content/70">
                <SummaryRow
                  label="Hero"
                  value={form.heroEnabled ? "Enabled" : "Hidden"}
                />
                <SummaryRow
                  label="Hero text"
                  value={`${form.heroTextColorMode} / ${form.heroOverlayStrength || "0"} overlay`}
                />
                <SummaryRow
                  label="Featured"
                  value={`${selectedFeaturedMode.label} / ${form.featuredMaxItems || "0"} items`}
                />
                <SummaryRow
                  label="Spotlight"
                  value={
                    spotlightProduct?.name ??
                    (form.spotlightProductId.trim()
                      ? `Product #${form.spotlightProductId}`
                      : "No product selected")
                  }
                />
                <SummaryRow
                  label="Collections"
                  value={`${collectionLinkedCount} of 4 blocks linked`}
                />
                <SummaryRow
                  label="Value cards"
                  value={`${valueCardCount} card${valueCardCount === 1 ? "" : "s"}`}
                />
                <SummaryRow
                  label="CTA"
                  value={form.ctaEnabled ? "Enabled" : "Hidden"}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
              <p className="text-sm font-semibold text-base-content">
                Product pickers only use public storefront products.
              </p>
              <p className="mt-2 text-sm leading-6 text-base-content/60">
                Active and out-of-stock products can be selected here because
                the public homepage should not link into draft or archived
                items.
              </p>
            </div>
          </aside>
        </div>
      )}
      <ConfirmActionModal
        isOpen={isHeroRemovalConfirmOpen}
        title="Remove hero image?"
        description="This removes the current hero image from the homepage draft. Save the homepage to persist the change."
        confirmLabel="Remove hero image"
        cancelLabel="Keep image"
        tone="error"
        isSubmitting={isRemovingHeroImage}
        onClose={() =>
          !isRemovingHeroImage && setIsHeroRemovalConfirmOpen(false)
        }
        onConfirm={() => void handleRemoveHeroImage()}
      />
    </section>
  );
}

function getHeroPreviewTextStyle(form: HomepageForm) {
  if (form.heroTextColorMode !== "CUSTOM") {
    return undefined;
  }

  const customTextColor = form.heroCustomTextColor.trim();
  return /^#(?:[0-9a-f]{6}|[0-9a-f]{3})$/i.test(customTextColor)
    ? { color: customTextColor }
    : undefined;
}

function getHeroPreviewTitleClassName(mode: HomepageHeroTextColorMode) {
  if (mode === "DARK") {
    return "text-slate-950";
  }

  return "text-white";
}

function getHeroPreviewSubtitleClassName(mode: HomepageHeroTextColorMode) {
  if (mode === "DARK") {
    return "text-slate-900/85";
  }

  return "text-white/88";
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-base-300 pl-2 pr-4 pb-3 pt-4">
      <div className="mb-4">
        <h5 className="text-lg font-semibold text-base-content">{title}</h5>
        <p className="mt-1 text-sm text-base-content/60">{description}</p>
      </div>

      <div className="space-y-4 mb-2">{children}</div>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-base-300 bg-base-200/30 px-4 py-3">
      <span className="text-sm font-medium text-base-content">{label}</span>
      <input
        type="checkbox"
        className="toggle toggle-primary"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  error?: string;
}) {
  return (
    <label className="form-control">
      <span className="label-text mb-1">{label}</span>
      <input
        type="number"
        className={`input input-bordered w-full ${error ? "input-error" : ""}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        min={min}
        max={max}
      />
      {error && <span className="mt-1 text-sm text-error">{error}</span>}
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
  disabled,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const normalizedValue = /^#(?:[0-9a-f]{6}|[0-9a-f]{3})$/i.test(value.trim())
    ? value.trim()
    : "#ffffff";

  return (
    <label className="form-control">
      <span className="label-text mb-1">{label}</span>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="color"
          className="h-12 w-full cursor-pointer rounded-xl border border-base-300 bg-base-100 px-1 disabled:cursor-not-allowed disabled:opacity-45 sm:w-18"
          value={normalizedValue}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        />
        <input
          type="text"
          className={`input input-bordered w-full font-mono ${error ? "input-error" : ""}`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={20}
          placeholder="#FFFFFF"
          disabled={disabled}
        />
      </div>
      {error && <span className="mt-1 text-sm text-error">{error}</span>}
    </label>
  );
}

function ProductSelectField({
  label,
  value,
  onChange,
  products,
  allProductsById,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  products: ProductDto[];
  allProductsById: Map<number, ProductDto>;
  error?: string;
  placeholder: string;
}) {
  const selectedProduct =
    value.trim() && Number.isInteger(Number(value))
      ? (allProductsById.get(Number(value)) ?? null)
      : null;
  const isSelectedProductVisible =
    selectedProduct != null &&
    PUBLIC_PRODUCT_STATUSES.includes(selectedProduct.status);

  return (
    <label className="form-control">
      <span className="label-text">{label}</span>
      <select
        className={`select select-bordered w-full mt-2 ${error ? "select-error" : ""}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {!isSelectedProductVisible && selectedProduct ? (
          <option value={selectedProduct.id}>
            {selectedProduct.name} (
            {formatProductStatus(selectedProduct.status)})
          </option>
        ) : null}
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name} ({formatProductStatus(product.status)})
          </option>
        ))}
      </select>
      {selectedProduct ? (
        <span className="mt-1 text-xs text-base-content/55">
          Linked product: {selectedProduct.name}
        </span>
      ) : null}
      {error && <span className="mt-1 text-sm text-error">{error}</span>}
    </label>
  );
}

function ProductMultiPicker({
  label,
  helperText,
  selectedProducts,
  missingProductIds,
  availableProducts,
  selectedProductIds,
  onAddProduct,
  onRemoveProduct,
  error,
  disabled,
}: {
  label: string;
  helperText: string;
  selectedProducts: ProductDto[];
  missingProductIds: number[];
  availableProducts: ProductDto[];
  selectedProductIds: number[];
  onAddProduct: (productId: number) => void;
  onRemoveProduct: (productId: number) => void;
  error?: string;
  disabled?: boolean;
}) {
  const addableProducts = availableProducts.filter(
    (product) => !selectedProductIds.includes(product.id),
  );
  const [pendingProductId, setPendingProductId] = useState("");

  return (
    <div className="space-y-3">
      <div>
        <p className="label-text mb-1">{label}</p>
        <p className="text-sm text-base-content/60">{helperText}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
        <select
          className="select select-bordered w-full"
          value={pendingProductId}
          onChange={(event) => setPendingProductId(event.target.value)}
          disabled={disabled || addableProducts.length === 0}
        >
          <option value="">Choose a product to add</option>
          {addableProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} ({formatProductStatus(product.status)})
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn btn-outline"
          disabled={!pendingProductId || disabled}
          onClick={() => {
            onAddProduct(Number(pendingProductId));
            setPendingProductId("");
          }}
        >
          <Plus className="h-4 w-4" />
          Add product
        </button>
      </div>

      {selectedProducts.length > 0 || missingProductIds.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              className="btn btn-sm btn-outline h-auto min-h-0 gap-2 py-2"
              onClick={() => onRemoveProduct(product.id)}
            >
              <span className="text-left">
                {product.name}
                <span
                  className={`badge badge-xs ml-2 ${getStatusBadgeClassName(product.status)}`}
                >
                  {formatProductStatus(product.status)}
                </span>
              </span>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ))}
          {missingProductIds.map((productId) => (
            <button
              key={`missing-${productId}`}
              type="button"
              className="btn btn-sm btn-outline btn-error h-auto min-h-0 gap-2 py-2"
              onClick={() => onRemoveProduct(productId)}
            >
              Missing product #{productId}
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-4 py-4 text-sm text-base-content/55">
          No manual featured products selected yet.
        </div>
      )}

      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
        {label}
      </p>
      <p className="mt-1 break-words leading-6">{value}</p>
    </div>
  );
}
