import OrderKanban from '@/components/orders/order-kanban';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Orders | SyncFlow Pro',
  description: 'Manage your orders in real-time.',
};

export default function OrdersPage() {
  return (
    <div className="flex h-full flex-col">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Order Management
      </h1>
      <p className="text-muted-foreground">
        Track and manage your orders from Shopify in real-time.
      </p>
      <div className="mt-6 flex-1">
        <OrderKanban />
      </div>
    </div>
  );
}
