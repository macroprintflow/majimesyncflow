import Shopify from 'shopify-api-node';

const { SHOPIFY_STORE_DOMAIN, SHOPIFY_API_ACCESS_TOKEN, SHOPIFY_API_VERSION } = process.env;

if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_API_ACCESS_TOKEN || !SHOPIFY_API_VERSION) {
  throw new Error("Shopify environment variables are not set");
}

// Clean up the domain to handle cases where the full URL might be entered
const shopName = SHOPIFY_STORE_DOMAIN
  .replace('https://', '')
  .replace('.myshopify.com', '');

const shopify = new Shopify({
  shopName: shopName,
  accessToken: SHOPIFY_API_ACCESS_TOKEN,
  apiVersion: SHOPIFY_API_VERSION
});

export default shopify;
