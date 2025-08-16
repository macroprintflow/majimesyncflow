// src/lib/actions/shopify.ts
'use server';

import {
  writeBatch, collection, getDocs, doc,
  serverTimestamp, Timestamp, query
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import shopify from '@/lib/shopify';
import type { Order } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function clearAllOrders() {
  try {
    console.log("Clearing all orders...");
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol);
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("No orders to clear.");
      return { success: true };
    }

    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`${querySnapshot.size} orders cleared successfully.`);
    revalidatePath('/dashboard/orders');
    return { success: true };
  } catch (error: any) {
    console.error('Error clearing orders:', error);
    return { success: false, error: error.message || 'Failed to clear orders.' };
  }
}

export async function syncShopifyOrders() {
  try {
    console.log('Fetching latest orders from Shopify...');
    const shopifyOrders = await shopify.order.list({ limit: 50 });
    console.log(`Found ${shopifyOrders.length} orders in Shopify.`);

    if (!shopifyOrders?.length) {
      return { success: true, message: 'No new orders to sync.' };
    }

    const batch = writeBatch(db);
    let upserts = 0;

    for (const order of shopifyOrders) {
      await processAndSaveOrder(order, batch);
      upserts++;
    }

    if (upserts > 0) {
      await batch.commit();
      console.log(`${upserts} orders upserted into Firestore.`);
    } else {
      console.log('No orders to upsert.');
    }

    revalidatePath('/dashboard/orders');
    return { success: true, message: `Upserted ${upserts} orders.` };
  } catch (error: any) {
    console.error('Error syncing Shopify orders:', error);
    return { success: false, error: error.message || 'Failed to sync orders from Shopify.' };
  }
}


// Helper: Shopify API returns either a numeric id or a GID
const getNumericId = (idLike: string | number) => {
  const s = String(idLike);
  return s.includes('/') ? s.split('/').pop()! : s;
};

/**
 * Processes a Shopify order object and adds it to a Firestore batch operation.
 * This can be used for both bulk sync and webhooks.
 * @param order - The Shopify order object.
 * @param batch - The Firestore write batch to add the operation to.
 */
export async function processAndSaveOrder(order: any, batch?: import('firebase/firestore').WriteBatch) {
    const ordersCol = collection(db, 'orders');
    const numericId = getNumericId(order.id);
    const shopifyId = `shp-${numericId}`;
    const createdAtTimestamp = order.created_at ? Timestamp.fromDate(new Date(order.created_at)) : serverTimestamp();
    const updatedAtTimestamp = order.updated_at ? Timestamp.fromDate(new Date(order.updated_at)) : serverTimestamp();

    const newOrder: Omit<Order, 'id'> & { createdAt: any, updatedAt: any } = {
      shopifyId,
      name: order.name,
      financialStatus: (order.financial_status as any) || 'pending',
      fulfillmentStatus: (order.fulfillment_status as any) || 'unfulfilled',
      appStatus: 'NEW',
      customer: {
        name: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
        email: order.customer?.email || '',
        phone: order.customer?.phone || '',
      },
      shippingAddress: {
        line1: order.shipping_address?.address1 || '',
        city: order.shipping_address?.city || '',
        state: order.shipping_address?.province || '',
        pincode: order.shipping_address?.zip || '',
        country: order.shipping_address?.country || '',
      },
      lineItems: order.line_items.map((li: any) => ({
        title: li.title,
        sku: li.sku || '',
        quantity: li.quantity,
        price: parseFloat(li.price),
        shopifyLineItemId: getNumericId(li.id),
      })),
      totals: {
        subtotal: parseFloat(order.subtotal_price || '0'),
        shipping: parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0'),
        tax: parseFloat(order.total_tax || '0'),
        discount: parseFloat(order.total_discounts || '0'),
        grandTotal: parseFloat(order.total_price || '0'),
        currency: order.currency || 'INR',
      },
      carrier: null,
      awb: { number: null, labelUrl: null },
      carrierErrors: [],
      createdAt: createdAtTimestamp,
      updatedAt: updatedAtTimestamp,
    };

    const orderRef = doc(ordersCol, shopifyId);

    const currentBatch = batch || writeBatch(db);
    currentBatch.set(orderRef, newOrder, { merge: true });

    // If no batch was provided, we commit it ourselves.
    if (!batch) {
        await currentBatch.commit();
        console.log(`Webhook processed and saved order ${shopifyId}`);
        // Revalidate path after saving to update UI
        revalidatePath('/dashboard/orders');
    }
}
