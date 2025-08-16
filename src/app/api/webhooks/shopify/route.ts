import { NextResponse } from 'next/server';
import crypto from 'crypto';
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

  if (!hmac || !shop || !topic) {
    return NextResponse.json({ error: 'Missing required Shopify headers' }, { status: 400 });
  }
  
  // The 'text()' method gives us the raw body.
  const rawBody = await req.text();

  // IMPORTANT: Verify the webhook signature
  const generatedHash = crypto
    .createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
    .update(rawBody, 'utf8')
    .digest('base64');

  if (generatedHash !== hmac) {
    console.warn('⚠️ Webhook received with invalid signature. Shop:', shop);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // We've verified the webhook, now we can process it.
  try {
    const orderData = JSON.parse(rawBody);
    
    // We only care about the 'orders/create' topic for now.
    if (topic === 'orders/create') {
      console.log(`Received new order webhook for order ${orderData.name} from ${shop}`);
      // Use the new shared function to process and save the order.
      // We don't pass a batch, so it will commit the change itself.
      await processAndSaveOrder(orderData);
    }
    
    // Acknowledge receipt of the webhook
    return NextResponse.json({ message: 'Webhook received' }, { status: 200 });

  } catch (error) {
    console.error('Error processing Shopify webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook processing failed: ${errorMessage}` }, { status: 500 });
  }
}
