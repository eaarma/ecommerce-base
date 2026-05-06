"use client";

import { PackagePlus, Pencil } from "lucide-react";
import { useState } from "react";

import AddProductModal from "@/components/manager/products/AddProductModal";
import EditProductModal from "@/components/manager/products/EditProductModal";
import { ProductDto } from "@/types/product";

type ProductSectionProps = {
  products: ProductDto[];
  loading: boolean;
  error: string | null;
  onProductCreated: () => Promise<void>;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const formatPrice = (price: ProductDto["price"]) =>
  currencyFormatter.format(Number(price));

const formatStatus = (status: ProductDto["status"]) =>
  status.replace(/_/g, " ").toLowerCase();

export default function ProductSection({
  products,
  loading,
  error,
  onProductCreated,
}: ProductSectionProps) {
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-base-300 bg-base-100">
        <div className="flex flex-col gap-4 border-b border-base-300 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-base-content">
              Products
            </h2>
            <p className="text-sm text-base-content/60">
              Catalog items currently stored in the backend.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm w-full sm:w-auto"
            onClick={() => setAddProductOpen(true)}
          >
            <PackagePlus className="h-4 w-4" aria-hidden="true" />
            Add product
          </button>
        </div>

        {loading && (
          <div className="px-5 py-8 text-sm text-base-content/60">
            Loading products...
          </div>
        )}

        {!loading && error && (
          <div className="px-5 py-8 text-sm text-error">{error}</div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="px-5 py-8 text-sm text-base-content/60">
            No products found.
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Variants</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th className="w-12">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-base-200">
                          {product.imageUrl ? (
                            <div
                              role="img"
                              aria-label={product.name}
                              className="h-full w-full bg-cover bg-center"
                              style={{
                                backgroundImage: `url(${product.imageUrl})`,
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-base font-semibold text-base-content/35">
                              {product.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="break-words font-medium text-base-content">
                            {product.name}
                          </p>
                          <p className="line-clamp-1 text-sm text-base-content/60">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="font-medium">{formatPrice(product.price)}</td>
                    <td>{product.variants.length}</td>
                    <td>{product.stockQuantity}</td>
                    <td>
                      <span
                        className={`badge capitalize ${
                          product.status === "ACTIVE"
                            ? "badge-success"
                            : product.status === "OUT_OF_STOCK"
                              ? "badge-warning"
                              : "badge-neutral"
                        }`}
                      >
                        {formatStatus(product.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        aria-label={`Edit ${product.name}`}
                        title="Edit product"
                        className="btn btn-ghost btn-sm btn-square"
                        onClick={() => setEditingProduct(product)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AddProductModal
        isOpen={addProductOpen}
        onClose={() => setAddProductOpen(false)}
        onProductCreated={onProductCreated}
      />

      {editingProduct && (
        <EditProductModal
          key={editingProduct.id}
          isOpen={Boolean(editingProduct)}
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onProductUpdated={onProductCreated}
        />
      )}
    </>
  );
}
