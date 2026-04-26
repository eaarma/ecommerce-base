import Link from "next/link";

import { ProductDto } from "@/types/product";

type ProductItemProps = {
  product: ProductDto;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const formatPrice = (price: ProductDto["price"]) =>
  currencyFormatter.format(Number(price));

const formatStatus = (status: ProductDto["status"]) =>
  status.replace(/_/g, " ").toLowerCase();

const placeholder = "/images/item_placeholder.jpg";

export default function ProductItem({ product }: ProductItemProps) {
  const inStock = product.stockQuantity > 0 && product.status !== "OUT_OF_STOCK";
  const productImageUrl = product.imageUrl?.trim();
  const isPlaceholder = !productImageUrl;
  const imageBackground = productImageUrl
    ? `url(${productImageUrl}), url(${placeholder})`
    : `url(${placeholder})`;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`View ${product.name}`}
    >
      <article className="flex h-full flex-col overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="aspect-[4/3] w-full overflow-hidden bg-base-200">
          <div
            role="img"
            aria-label={product.name}
            className={`h-full w-full bg-cover bg-center transition duration-300 group-hover:scale-105 ${
              isPlaceholder ? "opacity-70 grayscale" : ""
            }`}
            style={{ backgroundImage: imageBackground }}
          />
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="break-words text-lg font-semibold leading-snug text-base-content">
                {product.name}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-base-content/65">
                {product.description}
              </p>
            </div>

            <p className="shrink-0 text-lg font-bold text-primary">
              {formatPrice(product.price)}
            </p>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-2 text-sm">
            <span
              className={`badge ${inStock ? "badge-success" : "badge-neutral"}`}
            >
              {inStock ? `${product.stockQuantity} in stock` : "Out of stock"}
            </span>
            <span className="badge badge-outline capitalize">
              {formatStatus(product.status)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
