export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "OUT_OF_STOCK";

export type ProductDto = {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  status: ProductStatus;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductRequestDto = {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
};

export type UpdateProductRequestDto = CreateProductRequestDto & {
  status: ProductStatus;
};
