import ProductItem from "@/components/products/ProductItem";
import { ProductDto } from "@/types/product";

type ProductListProps = {
  products: ProductDto[];
  error?: string | null;
};

export default function ProductList({ products, error }: ProductListProps) {
  if (error) {
    return (
      <section className="rounded-lg border border-error/30 bg-error/10 p-6 text-sm text-error">
        {error}
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="rounded-lg border border-base-300 bg-base-100 p-8 text-center text-base-content/65">
        No products found.
      </section>
    );
  }

  return (
    <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductItem key={product.id} product={product} />
      ))}
    </section>
  );
}
