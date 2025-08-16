import type { Timestamp } from 'firebase/firestore';

export interface Customer {
  name: string;
  phone: string;
  email: string;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface LineItem {
  title: string;
  sku: string;
  quantity: number;
  price: number;
  shopifyLineItemId?: string;
}

export interface Totals {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  grandTotal: number;
  currency: string;
}

export interface AWB {
  number: string | null;
  labelUrl: string | null;
}

export interface CarrierError {
  carrier: 'DELHIVERY' | 'SHIPROCKET';
  code: string;
  message: string;
  timestamp: Timestamp;
}

export type OrderAppStatus = 'NEW' | 'CONFIRMED' | 'CANCELLED' | 'READY_TO_DISPATCH';

export interface Order {
  id: string;
  shopifyId: string;
  name: string; // The human-readable order number (e.g., #1001 or #OWR-MT11008)
  financialStatus: "paid" | "pending" | "refunded";
  fulfillmentStatus: "unfulfilled" | "fulfilled" | "partially_fulfilled";
  appStatus: OrderAppStatus;
  customer: Customer;
  shippingAddress: ShippingAddress;
  lineItems: LineItem[];
  totals: Totals;
  carrier: "DELHIVERY" | "SHIPROCKET" | null;
  awb: AWB;
  carrierErrors: CarrierError[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  shopifyCreatedAt?: Timestamp; // Legacy support
}

export interface Variant {
  sku: string;
  price: number;
  inventoryQty: number;
  optionValues: string;
  shopifyVariantId?: string;
}

export interface ProductImage {
  src: string;
  position: number;
  alt: string;
}

export interface Product {
  id: string;
  source: "shopify" | "app";
  shopifyId?: string;
  title: string;
  description: string;
  status: "active" | "draft" | "archived";
  variants: Variant[];
  images: ProductImage[];
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
