"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import ManagerShell from "@/components/manager/ManagerShell";
import ManagerStatCard from "@/components/manager/ManagerStatCard";
import ProductSection from "@/components/manager/ProductSection";
import { ManagerProductService } from "@/lib/managerProductService";
import type { ProductDto } from "@/types/product";

export default function ManagerProductsPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await ManagerProductService.getAllProducts();
      setProducts(data);
    } catch {
      setError("Could not load products. Please sign in with a staff account.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    ManagerProductService.getAllProducts()
      .then((data) => {
        if (!cancelled) {
          setProducts(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Could not load products. Please sign in with a staff account.",
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
  }, []);

  const activeProducts = useMemo(
    () => products.filter((product) => product.status === "ACTIVE").length,
    [products],
  );
  const outOfStockProducts = useMemo(
    () =>
      products.filter((product) => product.status === "OUT_OF_STOCK").length,
    [products],
  );
  const archivedProducts = useMemo(
    () => products.filter((product) => product.status === "ARCHIVED").length,
    [products],
  );

  return (
    <ManagerShell
      title="Products"
      description="Catalog-specific inventory and product management."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ManagerStatCard label="Total Products" value={products.length.toString()} />
        <ManagerStatCard label="Active Products" value={activeProducts.toString()} />
        <ManagerStatCard
          label="Out Of Stock"
          value={outOfStockProducts.toString()}
        />
        <ManagerStatCard
          label="Archived Products"
          value={archivedProducts.toString()}
        />
      </div>

      <ProductSection
        products={products}
        loading={loading}
        error={error}
        onProductCreated={loadProducts}
      />
    </ManagerShell>
  );
}
