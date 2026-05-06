export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "OUT_OF_STOCK";
export type ProductCategory =
  | "APPAREL"
  | "HOME"
  | "BEAUTY"
  | "ELECTRONICS"
  | "ACCESSORIES"
  | "GIFTS";
export type ProductAvailability = "IN_STOCK" | "OUT_OF_STOCK";
export type ProductPriceRange =
  | "UNDER_25"
  | "BETWEEN_25_AND_50"
  | "BETWEEN_50_AND_100"
  | "OVER_100";
export type ProductSortKey =
  | "updatedAt,desc"
  | "name,asc"
  | "name,desc"
  | "price,asc"
  | "price,desc"
  | "stockQuantity,desc";

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  APPAREL: "Apparel",
  HOME: "Home",
  BEAUTY: "Beauty",
  ELECTRONICS: "Electronics",
  ACCESSORIES: "Accessories",
  GIFTS: "Gifts",
};

export const formatProductCategory = (category: ProductCategory) =>
  PRODUCT_CATEGORY_LABELS[category];

export type ProductVariantDto = {
  id: number;
  sku: string;
  color: string | null;
  size: string | null;
  weight: string | null;
  material: string | null;
  label: string;
  price: number;
  stockQuantity: number;
  imageUrl: string | null;
  images: ProductImageDto[];
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProductImageDto = {
  id: number;
  variantId: number | null;
  imageUrl: string;
  storagePath: string | null;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductDto = {
  id: number;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  price: number;
  stockQuantity: number;
  category: ProductCategory | null;
  status: ProductStatus;
  mainImageUrl: string | null;
  imageUrl: string | null;
  traitsJson: string | null;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariantDto[];
  images: ProductImageDto[];
};

export type ProductPageQuery = {
  page?: number;
  size?: number;
  sort?: ProductSortKey | string;
  availability?: ProductAvailability[];
  priceRange?: ProductPriceRange[];
};

export type PageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type CreateProductVariantRequestDto = {
  id?: number;
  sku: string;
  color?: string;
  size?: string;
  weight?: string;
  material?: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  images?: CreateProductImageRequestDto[];
  status?: ProductStatus;
};

export type CreateProductImageRequestDto = {
  id?: number;
  variantId?: number | null;
  imageUrl: string;
  storagePath?: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
};

export type CreateProductImageRecordRequestDto = {
  variantId?: number | null;
  imageUrl: string;
  storagePath?: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
};

export type UploadedFirebaseProductImageDto = {
  imageUrl: string;
  storagePath: string;
  fileName: string;
  contentType: string | null;
  size: number;
};

export type CreateProductRequestDto = {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  category?: ProductCategory;
  status?: ProductStatus;
  mainImageUrl?: string;
  traitsJson?: string;
  variants: CreateProductVariantRequestDto[];
  images?: CreateProductImageRequestDto[];
};

export type UpdateProductRequestDto = Omit<CreateProductRequestDto, "status"> & {
  status: ProductStatus;
};
