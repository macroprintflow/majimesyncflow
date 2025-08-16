'use server';

import { writeBatch, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import shopify from '@/lib/shopify';
import type { Order } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function syncShopifyOrders() {
  try {
    console.log('Fetching latest orders from Shopify...');
    // Fetch the last 50 orders from Shopify
    const shopifyOrders = await shopify.order.list({ limit: 50 });
    console.log(`Found ${shopifyOrders.length} orders in Shopify.`);

    if (shopifyOrders.length === 0) {
      return { success: true, message: 'No new orders to sync.' };
    }

    const batch = writeBatch(db);
    const ordersCol = collection(db, 'orders');
    const existingShopifyIds = new Set<string>();

    // Firestore 'in' query has a limit of 30 values. We need to batch the check.
    const shopifyOrderIds = shopifyOrders.map(o => `shp-${o.id}`);
    const idChunks = [];
    for (let i = 0; i < shopifyOrderIds.length; i += 30) {
      idChunks.push(shopifyOrderIds.slice(i, i + 30));
    }

    // Query for existing orders in chunks
    for (const chunk of idChunks) {
      if (chunk.length > 0) {
        const q = query(ordersCol, where('shopifyId', 'in', chunk));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
          existingShopifyIds.add(doc.data().shopifyId);
        });
      }
    }

    console.log(`${existingShopifyIds.size} orders already exist in Firestore. Syncing new ones...`);
    
    let syncedCount = 0;
    shopifyOrders.forEach(order => {
      const shopifyId = `shp-${order.id}`;

      if (existingShopifyIds.has(shopifyId)) {
        return; // Skip if order already exists
      }

      const newOrder: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
        shopifyId: shopifyId,
        financialStatus: order.financial_status as any || 'pending',
        fulfillmentStatus: order.fulfillment_status as any || 'unfulfilled',
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
          shopifyLineItemId: String(li.id),
        })),
        totals: {
          subtotal: parseFloat(order.subtotal_price || '0'),
          shipping: parseFloat(order.total_shipping_price_set?.shop_money.amount || '0'),
          tax: parseFloat(order.total_tax || '0'),
          discount: parseFloat(order.total_discounts || '0'),
          grandTotal: parseFloat(order.total_price || '0'),
          currency: order.currency || 'INR',
        },
        carrier: null,
        awb: { number: null, labelUrl: null },
        carrierErrors: [],
      };

      const newOrderRef = doc(ordersCol);
      batch.set(newOrderRef, {
        ...newOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      syncedCount++;
    });

    if(syncedCount > 0){
        await batch.commit();
        console.log(`${syncedCount} new orders have been synced to Firestore.`);
    } else {
        console.log('No new orders to sync.');
    }

    revalidatePath('/dashboard/orders');
    return { success: true, message: `Synced ${syncedCount} new orders.` };
  } catch (error: any) {
    console.error('Error syncing Shopify orders:', error);
    return { success: false, error: error.message || 'Failed to sync orders from Shopify.' };
  }
}
