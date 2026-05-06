"use client";

import ProductEditorModal from "@/components/manager/products/ProductEditorModal";

type AddProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: () => Promise<void>;
};

export default function AddProductModal({
  isOpen,
  onClose,
  onProductCreated,
}: AddProductModalProps) {
  return isOpen ? (
    <ProductEditorModal
      isOpen={isOpen}
      mode="create"
      onClose={onClose}
      onSaved={onProductCreated}
    />
  ) : null;
}
