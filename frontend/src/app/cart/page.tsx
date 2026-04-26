import CartItemSection from "@/components/cart/CartItemSection";
import CartTotalSection from "@/components/cart/CartTotalSection";

export default function CartPage() {
  return (
    <div className="mx-auto min-h-screen max-w-7xl p-4 pt-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <CartItemSection />
        <CartTotalSection />
      </div>
    </div>
  );
}
