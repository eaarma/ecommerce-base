"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

import PhoneInput from "@/components/common/PhoneInput";
import { OrderService } from "@/lib/orderService";
import type { RootState } from "@/store/store";
import type { ReserveOrderRequest } from "@/types/order";

type CheckoutForm = {
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  deliveryAddressLine1: string;
  deliveryAddressLine2: string;
  deliveryCity: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
  deliveryPhone: string;
};

const initialForm: CheckoutForm = {
  customerEmail: "",
  customerFirstName: "",
  customerLastName: "",
  deliveryAddressLine1: "",
  deliveryAddressLine2: "",
  deliveryCity: "",
  deliveryPostalCode: "",
  deliveryCountry: "",
  deliveryPhone: "",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CheckoutPage() {
  const router = useRouter();
  const selectedItems = useSelector((state: RootState) =>
    state.cart.items.filter((item) => item.selected !== false),
  );
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof CheckoutForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!emailRegex.test(form.customerEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (
      !form.customerFirstName.trim() ||
      !form.customerLastName.trim() ||
      !form.deliveryAddressLine1.trim() ||
      !form.deliveryCity.trim() ||
      !form.deliveryPostalCode.trim() ||
      !form.deliveryCountry.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const phone = form.deliveryPhone.trim();

    if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    const request: ReserveOrderRequest = {
      customerEmail: form.customerEmail.trim(),
      customerFirstName: form.customerFirstName.trim(),
      customerLastName: form.customerLastName.trim(),
      deliveryAddressLine1: form.deliveryAddressLine1.trim(),
      deliveryAddressLine2: form.deliveryAddressLine2.trim() || null,
      deliveryCity: form.deliveryCity.trim(),
      deliveryPostalCode: form.deliveryPostalCode.trim(),
      deliveryCountry: form.deliveryCountry.trim(),
      deliveryPhone: phone || null,
      items: selectedItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    try {
      setIsSubmitting(true);
      const order = await OrderService.reserveOrder(request);

      router.push(
        `/payment/${order.id}?token=${encodeURIComponent(
          order.reservationToken,
        )}`,
      );
    } catch {
      toast.error("Failed to reserve order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4 pt-8">
      <div className="rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-base-content">Checkout</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="form-control">
              <span className="label-text">First Name</span>
              <input
                type="text"
                className="input input-bordered mt-1 w-full"
                value={form.customerFirstName}
                onChange={(event) =>
                  updateField("customerFirstName", event.target.value)
                }
                required
              />
            </label>

            <label className="form-control">
              <span className="label-text">Last Name</span>
              <input
                type="text"
                className="input input-bordered mt-1 w-full"
                value={form.customerLastName}
                onChange={(event) =>
                  updateField("customerLastName", event.target.value)
                }
                required
              />
            </label>
          </div>

          <label className="form-control">
            <span className="label-text">Email</span>
            <input
              type="email"
              className="input input-bordered mt-1 w-full"
              value={form.customerEmail}
              onChange={(event) =>
                updateField("customerEmail", event.target.value)
              }
              required
            />
          </label>

          <label className="form-control">
            <span className="label-text">Address</span>
            <input
              type="text"
              className="input input-bordered mt-1 w-full"
              value={form.deliveryAddressLine1}
              onChange={(event) =>
                updateField("deliveryAddressLine1", event.target.value)
              }
              required
            />
          </label>

          <label className="form-control">
            <span className="label-text">Apartment, suite, etc.</span>
            <input
              type="text"
              className="input input-bordered mt-1 w-full"
              value={form.deliveryAddressLine2}
              onChange={(event) =>
                updateField("deliveryAddressLine2", event.target.value)
              }
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="form-control">
              <span className="label-text">City</span>
              <input
                type="text"
                className="input input-bordered mt-1 w-full"
                value={form.deliveryCity}
                onChange={(event) =>
                  updateField("deliveryCity", event.target.value)
                }
                required
              />
            </label>

            <label className="form-control">
              <span className="label-text">Postal Code</span>
              <input
                type="text"
                className="input input-bordered mt-1 w-full"
                value={form.deliveryPostalCode}
                onChange={(event) =>
                  updateField("deliveryPostalCode", event.target.value)
                }
                required
              />
            </label>

            <label className="form-control">
              <span className="label-text">Country</span>
              <input
                type="text"
                className="input input-bordered mt-1 w-full"
                value={form.deliveryCountry}
                onChange={(event) =>
                  updateField("deliveryCountry", event.target.value)
                }
                required
              />
            </label>
          </div>

          <div>
            <span className="label-text">Phone</span>
            <div className="mt-1">
              <PhoneInput
                value={form.deliveryPhone}
                onChange={(phone) => updateField("deliveryPhone", phone)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isSubmitting || selectedItems.length === 0}
          >
            {isSubmitting ? "Reserving..." : "Payment"}
          </button>
        </form>
      </div>
    </main>
  );
}
