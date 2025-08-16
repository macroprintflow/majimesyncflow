"use server";

import { doc, updateDoc, serverTimestamp, arrayUnion, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { suggestCarrier, type SuggestCarrierInput } from "@/ai/flows/intelligent-carrier-selection";
import { revalidatePath } from "next/cache";
import type { BulkActionResults } from "@/lib/types";

// Mock API call to Shopify
async function mockCancelShopifyOrder(orderId: string) {
  console.log(`Cancelling order ${orderId} on Shopify...`);
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`Order ${orderId} cancelled on Shopify.`);
  return { success: true };
}

// Mock API call to Delhivery
async function mockAssignDelhiveryAwb(orderId: string) {
  console.log(`Assigning AWB for order ${orderId} with Delhivery...`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Simulate failure for demonstration
  if (Math.random() > 0.5) {
    console.log(`Delhivery failed for order ${orderId}.`);
    return { success: false, error: "Delhivery API is down" };
  }
  console.log(`Delhivery AWB assigned for order ${orderId}.`);
  return { success: true, awb: `DEL${Date.now()}`, labelUrl: "https://example.com/delhivery-label.pdf" };
}

// Mock API call to Shiprocket
async function mockAssignShiprocketAwb(orderId: string) {
  console.log(`Assigning AWB for order ${orderId} with Shiprocket...`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (Math.random() > 0.8) {
     console.log(`Shiprocket failed for order ${orderId}.`);
    return { success: false, error: "Shiprocket API is down" };
  }
  console.log(`Shiprocket AWB assigned for order ${orderId}.`);
  return { success: true, awb: `SHP${Date.now()}`, labelUrl: "https://example.com/shiprocket-label.pdf" };
}


export async function confirmOrder(orderId: string) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      appStatus: "CONFIRMED",
      updatedAt: serverTimestamp(),
    });
    revalidatePath("/dashboard/orders");
    return { success: true };
  } catch (error) {
    console.error("Error confirming order:", error);
    return { success: false, error: "Failed to confirm order." };
  }
}

export async function cancelOrder(orderId: string) {
  try {
    // First, cancel on Shopify
    const shopifyResult = await mockCancelShopifyOrder(orderId);
    if (!shopifyResult.success) {
      throw new Error("Failed to cancel order on Shopify.");
    }

    // Then, update Firestore
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      appStatus: "CANCELLED",
      updatedAt: serverTimestamp(),
    });
    revalidatePath("/dashboard/orders");
    return { success: true };
  } catch (error) {
    console.error("Error canceling order:", error);
    const message = error instanceof Error ? error.message : "Failed to cancel order.";
    return { success: false, error: message };
  }
}

export async function assignAwb(orderId: string) {
  const orderRef = doc(db, "orders", orderId);
  
  // Attempt Delhivery first
  const delhiveryResult = await mockAssignDelhiveryAwb(orderId);
  if (delhiveryResult.success) {
    await updateDoc(orderRef, {
      carrier: "DELHIVERY",
      "awb.number": delhiveryResult.awb,
      "awb.labelUrl": delhiveryResult.labelUrl,
      appStatus: "READY_TO_DISPATCH",
      updatedAt: serverTimestamp(),
    });
    revalidatePath("/dashboard/orders");
    return { success: true, carrier: "DELHIVERY" };
  }

  // Fallback to Shiprocket
  await updateDoc(orderRef, {
    carrierErrors: arrayUnion({ carrier: "DELHIVERY", message: delhiveryResult.error, code: "API_ERROR", timestamp: serverTimestamp() })
  });

  const shiprocketResult = await mockAssignShiprocketAwb(orderId);
  if (shiprocketResult.success) {
    await updateDoc(orderRef, {
      carrier: "SHIPROCKET",
      "awb.number": shiprocketResult.awb,
      "awb.labelUrl": shiprocketResult.labelUrl,
      appStatus: "READY_TO_DISPATCH",
      updatedAt: serverTimestamp(),
    });
    revalidatePath("/dashboard/orders");
    return { success: true, carrier: "SHIPROCKET" };
  }

  // Both failed
  await updateDoc(orderRef, {
    carrierErrors: arrayUnion({ carrier: "SHIPROCKET", message: shiprocketResult.error, code: "API_ERROR", timestamp: serverTimestamp() })
  });

  return { success: false, error: "Both Delhivery and Shiprocket failed to assign AWB." };
}

export async function suggestCarrierAction(input: SuggestCarrierInput) {
  try {
    const result = await suggestCarrier(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error suggesting carrier:", error);
    return { success: false, error: "AI failed to suggest a carrier." };
  }
}

export async function bulkConfirmOrders(orderIds: string[]): Promise<BulkActionResults> {
    const results: BulkActionResults = { success: 0, error: 0 };
    const batch = writeBatch(db);

    for (const orderId of orderIds) {
        try {
            const orderRef = doc(db, "orders", orderId);
            batch.update(orderRef, {
                appStatus: "CONFIRMED",
                updatedAt: serverTimestamp(),
            });
            results.success++;
        } catch (error) {
            console.error(`Error confirming order ${orderId}:`, error);
            results.error++;
        }
    }
    
    try {
        await batch.commit();
        revalidatePath("/dashboard/orders");
    } catch (error) {
        console.error("Error committing bulk confirm batch:", error);
        // This is tricky, the entire batch fails. Let's return a total failure.
        return { success: 0, error: orderIds.length };
    }
    
    return results;
}

export async function bulkCancelOrders(orderIds: string[]): Promise<BulkActionResults> {
    const results: BulkActionResults = { success: 0, error: 0 };
    
    // We can't use a single batch here because we need to await the Shopify API call for each order.
    for (const orderId of orderIds) {
        const result = await cancelOrder(orderId);
        if (result.success) {
            results.success++;
        } else {
            results.error++;
        }
    }
    
    revalidatePath("/dashboard/orders");
    return results;
}
