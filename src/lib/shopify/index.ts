import Shopify from 'shopify-api-node';

const { SHOPIFY_STORE_DOMAIN, SHOPIFY_API_ACCESS_TOKEN, SHOPIFY_API_VERSION } = process.env;

if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_API_ACCESS_TOKEN || !SHOPIFY_API_VERSION) {
  throw new Error("Shopify environment variables are not set");
}

const shopify = new Shopify({
  shopName: SHOPIFY_STORE_DOMAIN.replace('.myshopify.com', ''),
  accessToken: SHOPIFY_API_ACCESS_TOKEN,
  apiVersion: SHOPIFY_API_VERSION
});

export default shopify;
