"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

import PhoneInput from "@/components/common/PhoneInput";
import { OrderService } from "@/lib/orderService";
import type { RootState } from "@/store/store";
import type {
  DeliveryCarrier,
  DeliveryMethod,
  ReserveOrderRequest,
} from "@/types/order";
import {
  DELIVERY_CARRIER_LABELS,
  DELIVERY_METHOD_LABELS,
  PARCEL_LOCKER_OPTIONS,
} from "@/utils/delivery";

type CheckoutForm = {
  name: string;
  email: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  deliveryCarrier: DeliveryCarrier;
  parcelLockerId: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
};

const initialForm: CheckoutForm = {
  name: "",
  email: "",
  phone: "",
  deliveryMethod: "PARCEL_LOCKER",
  deliveryCarrier: "DPD",
  parcelLockerId: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  country: "",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const splitFullName = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

export default function CheckoutPage() {
  const router = useRouter();
  const selectedItems = useSelector((state: RootState) =>
    state.cart.items.filter((item) => item.selected !== false),
  );
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isParcelLocker = form.deliveryMethod === "PARCEL_LOCKER";
  const availableParcelLockers = PARCEL_LOCKER_OPTIONS[form.deliveryCarrier];
  const selectedParcelLocker = availableParcelLockers.find(
    (locker) => locker.id === form.parcelLockerId,
  );

  const updateField = (field: keyof CheckoutForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    const parsedName = splitFullName(form.name);

    if (!parsedName) {
      toast.error("Please enter your full name");
      return;
    }

    if (!emailRegex.test(form.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (
      !form.addressLine1.trim() ||
      !form.city.trim() ||
      !form.postalCode.trim() ||
      !form.country.trim()
    ) {
      toast.error("Please fill in all required address fields");
      return;
    }

    const phone = form.phone.trim();

    if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!phone) {
      toast.error("Please provide your phone number");
      return;
    }

    if (isParcelLocker && !selectedParcelLocker) {
      toast.error("Please select a parcel locker");
      return;
    }

    const request: ReserveOrderRequest = {
      customerEmail: form.email.trim(),
      customerFirstName: parsedName.firstName,
      customerLastName: parsedName.lastName,
      delivery: {
        method: form.deliveryMethod,
        carrier: form.deliveryCarrier,
        recipientName: form.name.trim(),
        recipientPhone: phone,
        recipientEmail: form.email.trim(),
        parcelLockerId: isParcelLocker
          ? (selectedParcelLocker?.id ?? null)
          : null,
        parcelLockerName: isParcelLocker
          ? (selectedParcelLocker?.name ?? null)
          : null,
        parcelLockerAddress: isParcelLocker
          ? (selectedParcelLocker?.address ?? null)
          : null,
        addressLine1: isParcelLocker ? null : form.addressLine1.trim(),
        addressLine2: isParcelLocker ? null : form.addressLine2.trim() || null,
        city: isParcelLocker ? null : form.city.trim(),
        postalCode: isParcelLocker ? null : form.postalCode.trim(),
        country: isParcelLocker ? null : form.country.trim(),
      },
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
    <main className="min-h-screen  px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-[28px] border border-base-300 bg-base-100 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-base-300 bg-[linear-gradient(135deg,rgba(224,242,254,0.95)_0%,rgba(249,250,251,0.98)_55%,rgba(236,253,245,0.95)_100%)] px-6 py-8 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">
              Checkout
            </p>
            <h1 className="mt-3 text-3xl font-bold text-base-content">
              Delivery Details
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-base-content/65">
              A simple checkout flow: contact details first, address second,
              then choose how the order should arrive.
            </p>
          </div>

          <div className="px-6 py-8 sm:px-8">
            <form
              onSubmit={handleSubmit}
              className="mx-auto max-w-xl space-y-8"
            >
              <section className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-content">
                    1
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-base-content">
                      Contact
                    </h2>
                    <p className="text-sm text-base-content/60">
                      We will use these details for the order and delivery.
                    </p>
                  </div>
                </div>

                <label className="form-control">
                  <span className="label-text font-medium text-base-content/80">
                    Name
                  </span>
                  <input
                    type="text"
                    autoComplete="name"
                    className="input input-bordered mt-2 h-12 w-full bg-base-100"
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="First and last name"
                    required
                  />
                </label>

                <label className="form-control">
                  <span className="label-text font-medium text-base-content/80">
                    Email
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    className="input input-bordered mt-2 h-12 w-full bg-base-100"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    required
                  />
                </label>

                <div className="form-control">
                  <span className="label-text font-medium text-base-content/80">
                    Phone
                  </span>
                  <div className="mt-2">
                    <PhoneInput
                      value={form.phone}
                      onChange={(phone) => updateField("phone", phone)}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-content">
                    2
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-base-content">
                      Address
                    </h2>
                    <p className="text-sm text-base-content/60">
                      Used for billing, and also for postal delivery if you
                      choose it below.
                    </p>
                  </div>
                </div>

                <label className="form-control">
                  <span className="label-text font-medium text-base-content/80">
                    Address
                  </span>
                  <input
                    type="text"
                    autoComplete="street-address"
                    className="input input-bordered mt-2 h-12 w-full bg-base-100"
                    value={form.addressLine1}
                    onChange={(event) =>
                      updateField("addressLine1", event.target.value)
                    }
                    required
                  />
                </label>

                <label className="form-control">
                  <span className="label-text font-medium text-base-content/80">
                    Apartment, suite, etc.
                  </span>
                  <input
                    type="text"
                    autoComplete="address-line2"
                    className="input input-bordered mt-2 h-12 w-full bg-base-100"
                    value={form.addressLine2}
                    onChange={(event) =>
                      updateField("addressLine2", event.target.value)
                    }
                  />
                </label>

                <label className="form-control">
                  <span className="label-text font-medium text-base-content/80">
                    City
                  </span>
                  <input
                    type="text"
                    autoComplete="address-level2"
                    className="input input-bordered mt-2 h-12 w-full bg-base-100"
                    value={form.city}
                    onChange={(event) =>
                      updateField("city", event.target.value)
                    }
                    required
                  />
                </label>

                <label className="form-control">
                  <span className="label-text font-medium text-base-content/80">
                    Postal Code
                  </span>
                  <input
                    type="text"
                    autoComplete="postal-code"
                    className="input input-bordered mt-2 h-12 w-full bg-base-100"
                    value={form.postalCode}
                    onChange={(event) =>
                      updateField("postalCode", event.target.value)
                    }
                    required
                  />
                </label>

                <label className="form-control">
                  <span className="label-text font-medium text-base-content/80">
                    Country
                  </span>
                  <input
                    type="text"
                    autoComplete="country-name"
                    className="input input-bordered mt-2 h-12 w-full bg-base-100"
                    value={form.country}
                    onChange={(event) =>
                      updateField("country", event.target.value)
                    }
                    required
                  />
                </label>
              </section>

              <section className="space-y-4 rounded-2xl border border-base-300 bg-base-200/40 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-content">
                    3
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-base-content">
                      Delivery Method
                    </h2>
                    <p className="text-sm text-base-content/60">
                      Choose between parcel locker pickup or shipping to the
                      address above.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(
                    Object.entries(DELIVERY_METHOD_LABELS) as Array<
                      [DeliveryMethod, string]
                    >
                  ).map(([method, label]) => (
                    <button
                      key={method}
                      type="button"
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                        form.deliveryMethod === method
                          ? "border-primary bg-primary/10 text-primary shadow-[0_10px_30px_rgba(2,132,199,0.12)]"
                          : "border-base-300 bg-base-100 text-base-content hover:border-primary/40 hover:bg-primary/5"
                      }`}
                      onClick={() => updateField("deliveryMethod", method)}
                    >
                      <span className="block text-base font-semibold">
                        {label}
                      </span>
                      <span className="mt-1 block text-sm opacity-70">
                        {method === "PARCEL_LOCKER"
                          ? "Pick up from a selected locker."
                          : "Send it to the address you entered above."}
                      </span>
                    </button>
                  ))}
                </div>

                <label className="form-control">
                  <span className="label-text font-medium text-base-content/80">
                    Carrier
                  </span>
                  <select
                    className="select select-bordered mt-2 h-12 w-full bg-base-100"
                    value={form.deliveryCarrier}
                    onChange={(event) => {
                      updateField(
                        "deliveryCarrier",
                        event.target.value as DeliveryCarrier,
                      );
                      updateField("parcelLockerId", "");
                    }}
                  >
                    {(
                      Object.entries(DELIVERY_CARRIER_LABELS) as Array<
                        [DeliveryCarrier, string]
                      >
                    ).map(([carrier, label]) => (
                      <option key={carrier} value={carrier}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                {isParcelLocker ? (
                  <div className="space-y-4">
                    <label className="form-control">
                      <span className="label-text font-medium text-base-content/80">
                        Parcel Locker
                      </span>
                      <select
                        className="select select-bordered mt-2 h-12 w-full bg-base-100"
                        value={form.parcelLockerId}
                        onChange={(event) =>
                          updateField("parcelLockerId", event.target.value)
                        }
                        required
                      >
                        <option value="">Select a parcel locker</option>
                        {availableParcelLockers.map((locker) => (
                          <option key={locker.id} value={locker.id}>
                            {locker.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    {selectedParcelLocker && (
                      <div className="rounded-2xl border border-primary/15 bg-base-100 p-4 text-sm shadow-sm">
                        <p className="font-semibold text-base-content">
                          {selectedParcelLocker.name}
                        </p>
                        <p className="mt-1 leading-6 text-base-content/70">
                          {selectedParcelLocker.address}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-success/15 bg-success/5 p-4 text-sm leading-6 text-base-content/75">
                    Postal delivery will use the address from step 2.
                  </div>
                )}
              </section>

              <button
                type="submit"
                className="btn btn-primary h-12 w-full text-base"
                disabled={isSubmitting || selectedItems.length === 0}
              >
                {isSubmitting ? "Reserving..." : "Payment"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
