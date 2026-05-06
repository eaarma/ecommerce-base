"use client";

import ProductEditorModal from "@/components/manager/products/ProductEditorModal";
import type { ProductDto } from "@/types/product";

type EditProductModalProps = {
  isOpen: boolean;
  product: ProductDto;
  onClose: () => void;
  onProductUpdated: () => Promise<void>;
};

export default function EditProductModal({
  isOpen,
  product,
  onClose,
  onProductUpdated,
}: EditProductModalProps) {
  return isOpen ? (
    <ProductEditorModal
      isOpen={isOpen}
      mode="edit"
      product={product}
      onClose={onClose}
      onSaved={onProductUpdated}
    />
  ) : null;
}
