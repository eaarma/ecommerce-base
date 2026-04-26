import ProductList from "@/components/products/ProductList";
import { ProductService } from "@/lib/productService";
import { ProductDto } from "@/types/product";

export default async function Home() {
  let products: ProductDto[] = [];
  let error: string | null = null;

  try {
    products = await ProductService.getAllProducts();
  } catch {
    error = "Could not load products right now.";
  }

  return (
    <div className="min-h-screen bg-base-100 font-sans">
      <main className="mx-auto flex w-full flex-col gap-8 py-10 sm:px-10 lg:px-12">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Ecommerce Store
          </p>
        </header>

        <ProductList products={products} error={error} />
      </main>
    </div>
  );
}
