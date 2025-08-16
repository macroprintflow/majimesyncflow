// src/lib/actions/shopify.ts
'use server';

import {
  writeBatch, collection, getDoc, doc,
  serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import shopify from '@/lib/shopify';
import type { Order } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function clearAllOrders() {
  try {
    // This is a placeholder for a more robust batch delete
    // For now, this is NOT implemented to prevent accidental data loss.
    // In a real scenario, you'd use a Firebase Extension or a Cloud Function for bulk deletes.
    console.log("Clearing all orders... (mock action)");
    // To implement, you would query all documents and delete them in batches.
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
    const ordersCol = collection(db, 'orders');

    // Helper: Shopify API returns either a numeric id or a GID
    const getNumericId = (idLike: string | number) => {
      const s = String(idLike);
      return s.includes('/') ? s.split('/').pop()! : s;
    };

    let upserts = 0;

    for (const order of shopifyOrders) {
      const numericId = getNumericId(order.id);
      const shopifyId = `shp-${numericId}`;
      const createdAtTimestamp = order.created_at ? Timestamp.fromDate(new Date(order.created_at)) : serverTimestamp();
      const updatedAtTimestamp = order.updated_at ? Timestamp.fromDate(new Date(order.updated_at)) : serverTimestamp();

      const newOrder: Omit<Order, 'id'> & { createdAt: any, updatedAt: any } = {
        shopifyId,
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
        lineItems: order.line_items.map(li => ({
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

      // Use deterministic doc ID = Shopify ID
      const orderRef = doc(ordersCol, shopifyId);

      // Upsert (merge) so re-syncs update instead of duplicating
      batch.set(orderRef, newOrder, { merge: true });
      upserts++;
    }

    if (upserts) {
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
