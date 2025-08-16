import ProductTable from '@/components/products/product-table';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Products | SyncFlow Pro',
  description: 'Manage your products in real-time.',
};

export default function ProductsPage() {
  return (
    <div className="flex h-full flex-col">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Product Inventory
      </h1>
      <p className="text-muted-foreground">
        Create, edit, and sync your products with Shopify.
      </p>
      <div className="mt-6 flex-1">
        <ProductTable />
      </div>
    </div>
  );
}
