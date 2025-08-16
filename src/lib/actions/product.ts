"use server";

import { collection, writeBatch, doc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import type { Product } from "@/lib/types";
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
    
    const batch = writeBatch(db);
    batch.set(productRef, finalData, { merge: true });

    if (productData.source === 'app') {
      const shopifyResult = await mockPushProductToShopify(productData as Product);
      if (shopifyResult.success) {
        batch.update(productRef, { shopifyId: shopifyResult.shopifyId });
      }
    }
    
    await batch.commit();

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
