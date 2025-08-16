"use server";

import { collection, writeBatch, doc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import type { Product, Order } from "@/lib/types";
import { revalidatePath } from "next/cache";

// Mock API call to Shopify
async function mockPushProductToShopify(product: Omit<Product, 'id'>) {
  console.log(`Pushing product "${product.title}" to Shopify...`);
  await new Promise(resolve => setTimeout(resolve, 500));
  const shopifyId = `shpfy-${Date.now()}`;
  console.log(`Product pushed. Shopify ID: ${shopifyId}`);
  return { success: true, shopifyId };
}

export async function upsertProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, productId?: string) {
  try {
    const productRef = productId ? doc(db, "products", productId) : doc(collection(db, "products"));
    
    const finalData: any = {
      ...productData,
      updatedAt: serverTimestamp()
    };
    
    if (!productId) {
      finalData.createdAt = serverTimestamp();
    }
    
    await writeBatch(db).set(productRef, finalData, { merge: true }).commit();

    if (productData.source === 'app') {
      const shopifyResult = await mockPushProductToShopify(productData as Product);
      if (shopifyResult.success) {
        await updateDoc(productRef, { shopifyId: shopifyResult.shopifyId });
      }
    }

    revalidatePath("/dashboard/products");
    return { success: true, id: productRef.id };
  } catch (error) {
    console.error("Error upserting product:", error);
    return { success: false, error: "Failed to save product." };
  }
}

export async function deleteProduct(productId: string) {
  try {
    const productRef = doc(db, "products", productId);
    await deleteDoc(productRef);
    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Failed to delete product." };
  }
}

export async function seedData() {
  const batch = writeBatch(db);

  // Sample Products
  const products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { source: 'app', title: 'Ergonomic Office Chair', description: 'High-back ergonomic chair with lumbar support.', status: 'active', variants: [{ sku: 'CHR-BLK-01', price: 15000, inventoryQty: 50, optionValues: 'Black' }], images: [], tags: ['office', 'furniture'] },
    { source: 'app', title: 'Wireless Mechanical Keyboard', description: '75% layout with hot-swappable switches.', status: 'active', variants: [{ sku: 'KBD-WRL-01', price: 8500, inventoryQty: 120, optionValues: 'White' }], images: [], tags: ['tech', 'keyboard'] },
    { source: 'draft', title: 'UltraWide 4K Monitor', description: '34-inch curved monitor for productivity.', status: 'draft', variants: [{ sku: 'MON-UW-4K-01', price: 45000, inventoryQty: 30, optionValues: 'Standard' }], images: [], tags: ['tech', 'monitor'] },
  ];

  products.forEach(product => {
    const ref = doc(collection(db, "products"));
    batch.set(ref, { ...product, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });

  // Sample Orders
  const orders: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { shopifyId: 'shp-1001', financialStatus: 'paid', fulfillmentStatus: 'unfulfilled', appStatus: 'NEW', customer: { name: 'Alice Johnson', email: 'alice@example.com', phone: '1234567890' }, shippingAddress: { line1: '123 Tech Park', city: 'Bangalore', state: 'Karnataka', pincode: '560001', country: 'India' }, lineItems: [{ title: 'Wireless Mechanical Keyboard', sku: 'KBD-WRL-01', quantity: 1, price: 8500 }], totals: { subtotal: 8500, shipping: 100, tax: 1530, discount: 0, grandTotal: 10130, currency: 'INR' }, carrier: null, awb: { number: null, labelUrl: null }, carrierErrors: [] },
    { shopifyId: 'shp-1002', financialStatus: 'paid', fulfillmentStatus: 'unfulfilled', appStatus: 'CONFIRMED', customer: { name: 'Bob Williams', email: 'bob@example.com', phone: '0987654321' }, shippingAddress: { line1: '456 Business Bay', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' }, lineItems: [{ title: 'Ergonomic Office Chair', sku: 'CHR-BLK-01', quantity: 1, price: 15000 }], totals: { subtotal: 15000, shipping: 500, tax: 2700, discount: 1000, grandTotal: 17200, currency: 'INR' }, carrier: null, awb: { number: null, labelUrl: null }, carrierErrors: [] },
    { shopifyId: 'shp-1003', financialStatus: 'paid', fulfillmentStatus: 'fulfilled', appStatus: 'READY_TO_DISPATCH', customer: { name: 'Charlie Brown', email: 'charlie@example.com', phone: '5555555555' }, shippingAddress: { line1: '789 Commerce St', city: 'Delhi', state: 'Delhi', pincode: '110001', country: 'India' }, lineItems: [{ title: 'UltraWide 4K Monitor', sku: 'MON-UW-4K-01', quantity: 2, price: 45000 }], totals: { subtotal: 90000, shipping: 1000, tax: 16200, discount: 5000, grandTotal: 102200, currency: 'INR' }, carrier: 'DELHIVERY', awb: { number: 'DEL123456789', labelUrl: '#' }, carrierErrors: [] },
    { shopifyId: 'shp-1004', financialStatus: 'paid', fulfillmentStatus: 'unfulfilled', appStatus: 'CANCELLED', customer: { name: 'Diana Prince', email: 'diana@example.com', phone: '1112223333' }, shippingAddress: { line1: '101 Startup Lane', city: 'Pune', state: 'Maharashtra', pincode: '411001', country: 'India' }, lineItems: [{ title: 'Ergonomic Office Chair', sku: 'CHR-BLK-01', quantity: 1, price: 15000 }], totals: { subtotal: 15000, shipping: 500, tax: 2700, discount: 0, grandTotal: 18200, currency: 'INR' }, carrier: null, awb: { number: null, labelUrl: null }, carrierErrors: [] },
  ];

   orders.forEach(order => {
    const ref = doc(collection(db, "orders"));
    batch.set(ref, { ...order, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });

  try {
    await batch.commit();
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/products");
    return { success: true, message: "Sample data seeded successfully." };
  } catch (error) {
    console.error("Error seeding data:", error);
    return { success: false, error: "Failed to seed data." };
  }
}
