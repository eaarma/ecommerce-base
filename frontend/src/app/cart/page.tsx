import CartItemSection from "@/components/cart/CartItemSection";
import CartTotalSection from "@/components/cart/CartTotalSection";

export default function CartPage() {
  return (
    <main className="min-h-screen  px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[28px] border border-base-300 bg-base-100 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-base-300 px-6 py-8 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">
              Cart
            </p>
            <h1 className="mt-3 text-3xl font-bold text-base-content">
              Review Your Order
            </h1>
          </div>

          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <CartItemSection />
            <CartTotalSection />
          </div>
        </div>
      </div>
    </main>
  );
}
