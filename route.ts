// src/app/api/webhooks/shopify/route.ts
import crypto from "crypto";
import * as admin from "firebase-admin";

// Ensure Node runtime (not Edge) and allow dynamic
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Initialize Admin SDK once (App Hosting uses ADC, so no creds file needed)
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

// Constant-time compare
function safeEqual(a: string, b: string) {
  const A = Buffer.from(a, "utf8");
  const B = Buffer.from(b, "utf8");
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

function getNumericId(idLike: string | number) {
  const s = String(idLike);
  return s.includes("/") ? s.split("/").pop()! : s;
}

export async function POST(req: Request) {
  if (!SHOPIFY_WEBHOOK_SECRET) {
    console.error("SHOPIFY_WEBHOOK_SECRET is not set");
    return new Response("Server not configured", { status: 500 });
  }

  // Required headers
  const hmac = req.headers.get("x-shopify-hmac-sha256") || "";
  const topic = req.headers.get("x-shopify-topic") || "";
  const shopDomain = req.headers.get("x-shopify-shop-domain") || "";
  const webhookId = req.headers.get("x-shopify-webhook-id") || "";

  if (!hmac || !topic || !shopDomain || !webhookId) {
    return new Response("Missing Shopify headers", { status: 400 });
  }

  // IMPORTANT: read RAW body and compute HMAC on it
  const raw = await req.text();
  const digest = crypto.createHmac("sha256", SHOPIFY_WEBHOOK_SECRET).update(raw).digest("base64");
  if (!safeEqual(hmac, digest)) {
    console.warn("Invalid HMAC for webhook from", shopDomain);
    return new Response("Invalid signature", { status: 401 });
  }

  // Parse JSON only after verifying signature
  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  // Idempotency: skip if already processed
  const evtRef = db.collection("processedWebhooks").doc(webhookId);
  const seen = await evtRef.get();
  if (seen.exists) {
    return new Response("OK", { status: 200 });
  }

  // Minimal routing
  try {
    switch (topic) {
      case "orders/create":
      case "orders/updated":
      case "orders/cancelled":
        await upsertOrderFromShopifyPayload(payload, topic === "orders/cancelled" ? "CANCELLED" : undefined);
        break;
      default:
        // Unhandled topic is fine—still ack 200
        break;
    }

    // Mark processed (idempotency)
    await evtRef.set({
      topic,
      shopDomain,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Acknowledge quickly (<5s)
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook processing error:", err);
    // Still return 200 so Shopify doesn't disable the webhook; investigate logs
    return new Response("OK", { status: 200 });
  }
}

async function upsertOrderFromShopifyPayload(order: any, cancelledStatus?: "CANCELLED") {
  const numericId = getNumericId(order.id);
  const docId = `shp-${numericId}`;
  const orderRef = db.collection("orders").doc(docId);

  const createdStr = order.created_at ?? order.createdAt;
  const updatedStr = order.updated_at ?? order.updatedAt;

  const shopifyCreatedAt = createdStr
    ? admin.firestore.Timestamp.fromDate(new Date(createdStr))
    : admin.firestore.FieldValue.serverTimestamp();

  const shopifyUpdatedAt = updatedStr
    ? admin.firestore.Timestamp.fromDate(new Date(updatedStr))
    : admin.firestore.FieldValue.serverTimestamp();

  const data = {
    shopifyId: docId,
    name: order.name ?? "", // Shopify human order number like "#1001"
    financialStatus: order.financial_status ?? "pending",
    fulfillmentStatus: order.fulfillment_status ?? "unfulfilled",
    appStatus: cancelledStatus ?? "NEW",
    customer: {
      name: `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim(),
      email: order.customer?.email || "",
      phone: order.customer?.phone || "",
    },
    shippingAddress: {
      line1: order.shipping_address?.address1 || "",
      city: order.shipping_address?.city || "",
      state: order.shipping_address?.province || "",
      pincode: order.shipping_address?.zip || "",
      country: order.shipping_address?.country || "",
    },
    lineItems: (order.line_items || []).map((li: any) => ({
      title: li.title,
      sku: li.sku || "",
      quantity: li.quantity,
      price: parseFloat(li.price),
      shopifyLineItemId: getNumericId(li.id),
    })),
    totals: {
      subtotal: parseFloat(order.subtotal_price || "0"),
      shipping: parseFloat(order.total_shipping_price_set?.shop_money?.amount || "0"),
      tax: parseFloat(order.total_tax || "0"),
      discount: parseFloat(order.total_discounts || "0"),
      grandTotal: parseFloat(order.total_price || "0"),
      currency: order.currency || "INR",
    },
    carrier: null,
    awb: { number: null, labelUrl: null },
    carrierErrors: [],
    shopifyCreatedAt,
    shopifyUpdatedAt,
    syncedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await orderRef.set(data, { merge: true });
}
