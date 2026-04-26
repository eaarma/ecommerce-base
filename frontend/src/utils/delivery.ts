import type {
  Delivery,
  DeliveryCarrier,
  DeliveryMethod,
  DeliveryStatus,
} from "@/types/order";

export type ParcelLockerOption = {
  id: string;
  name: string;
  address: string;
};

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  PARCEL_LOCKER: "Parcel locker",
  POSTAL_DELIVERY: "Postal delivery",
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  NOT_READY: "Not ready",
  READY_TO_SHIP: "Ready to ship",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const DELIVERY_CARRIER_LABELS: Record<DeliveryCarrier, string> = {
  DPD: "DPD",
  OMNIVA: "Omniva",
  ITELLA: "Itella",
  OTHER: "Other",
};

export const PARCEL_LOCKER_OPTIONS: Record<
  DeliveryCarrier,
  ParcelLockerOption[]
> = {
  DPD: [
    {
      id: "DPD-TLL-001",
      name: "DPD Kristiine Keskus",
      address: "Endla 45, Tallinn, Estonia",
    },
    {
      id: "DPD-TLL-002",
      name: "DPD Rocca al Mare",
      address: "Paldiski mnt 102, Tallinn, Estonia",
    },
  ],
  OMNIVA: [
    {
      id: "OMNIVA-TLL-001",
      name: "Omniva Solaris",
      address: "Estonia pst 9, Tallinn, Estonia",
    },
    {
      id: "OMNIVA-TLL-002",
      name: "Omniva Tartu Kaubamaja",
      address: "Riia 1, Tartu, Estonia",
    },
  ],
  ITELLA: [
    {
      id: "ITELLA-TLL-001",
      name: "Itella Mustamäe",
      address: "A. H. Tammsaare tee 104a, Tallinn, Estonia",
    },
    {
      id: "ITELLA-TLL-002",
      name: "Itella Fama Keskus",
      address: "Fama 10, Narva, Estonia",
    },
  ],
  OTHER: [
    {
      id: "OTHER-TLL-001",
      name: "Generic parcel locker",
      address: "Static demo locker selection",
    },
  ],
};

export const formatDeliveryMethod = (method: DeliveryMethod) =>
  DELIVERY_METHOD_LABELS[method];

export const formatDeliveryStatus = (status: DeliveryStatus) =>
  DELIVERY_STATUS_LABELS[status];

export const formatDeliveryCarrier = (carrier: DeliveryCarrier) =>
  DELIVERY_CARRIER_LABELS[carrier];

export const getDeliveryDestinationLines = (delivery: Delivery): string[] => {
  if (delivery.method === "PARCEL_LOCKER") {
    return [delivery.parcelLockerName, delivery.parcelLockerAddress].filter(
      (value): value is string => Boolean(value),
    );
  }

  const primaryLine = [delivery.addressLine1, delivery.addressLine2]
    .filter((value): value is string => Boolean(value))
    .join(", ");
  const cityLine = [delivery.city, delivery.postalCode]
    .filter((value): value is string => Boolean(value))
    .join(", ");

  return [primaryLine, cityLine, delivery.country].filter(
    (value): value is string => Boolean(value),
  );
};
