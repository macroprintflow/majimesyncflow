import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { processAndSaveOrder } from '@/lib/actions/shopify';

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!SHOPIFY_WEBHOOK_SECRET) {
    console.error('Shopify webhook secret is not set.');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const hmac = req.headers.get('x-shopify-hmac-sha256');
  const shop = req.headers.get('x-shopify-shop-domain');
  const topic = req.headers.get('x-shopify-topic');
  const webhookId = req.headers.get('x-shopify-webhook-id');

  if (!hmac || !shop || !topic || !webhookId) {
    return NextResponse.json({ error: 'Missing required Shopify headers' }, { status: 400 });
  }
  
  const rawBody = await req.text();

  const generatedHash = crypto
    .createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
    .update(rawBody, 'utf8')
    .digest('base64');

  if (generatedHash !== hmac) {
    console.warn('⚠️ Webhook received with invalid signature. Shop:', shop);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Idempotency check: Ensure we haven't processed this webhook before
  const webhookRef = doc(db, 'processedWebhooks', webhookId);
  try {
    const webhookDoc = await getDoc(webhookRef);
    if (webhookDoc.exists()) {
      console.log(`Webhook ${webhookId} already processed. Skipping.`);
      return NextResponse.json({ message: 'Webhook already processed' }, { status: 200 });
    }
  } catch (dbError) {
      console.error("Error checking for webhook idempotency:", dbError);
      // Decide if you want to proceed or return an error.
      // For now, we'll log and continue, but in production you might want to fail here.
  }


  try {
    const payload = JSON.parse(rawBody);
    
    console.log(`Received webhook topic: ${topic} for order ${payload.name} from ${shop}`);
    
    switch (topic) {
      case 'orders/create':
      case 'orders/updated':
        await processAndSaveOrder(payload);
        break;
      case 'orders/cancelled':
        // For cancellations, we just need to update the status.
        await processAndSaveOrder(payload, undefined, 'CANCELLED');
        break;
      default:
        console.log(`Unhandled webhook topic: ${topic}`);
    }

    // Mark webhook as processed
    await setDoc(webhookRef, { processedAt: serverTimestamp(), topic: topic });
    
    return NextResponse.json({ message: 'Webhook received and processed' }, { status: 200 });

  } catch (error) {
    console.error('Error processing Shopify webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook processing failed: ${errorMessage}` }, { status: 500 });
  }
}
