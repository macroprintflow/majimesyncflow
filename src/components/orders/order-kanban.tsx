"use client";

import { useCollection } from "@/lib/hooks/use-collection";
import type { Order, OrderAppStatus } from "@/lib/types";
import OrderCard from "./order-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const columns: { title: string; status: OrderAppStatus }[] = [
  { title: "New Orders", status: "NEW" },
  { title: "Confirmed", status: "CONFIRMED" },
  { title: "Ready to Dispatch", status: "READY_TO_DISPATCH" },
  { title: "Cancelled", status: "CANCELLED" },
];

const KanbanColumn = ({ title, orders, status }: { title: string; orders: Order[]; status: OrderAppStatus }) => {
  const filteredOrders = orders.filter(order => order.appStatus === status);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <span className="text-sm font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">
            {filteredOrders.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-2">
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => <OrderCard key={order.id} order={order} />)
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <p className="text-sm text-muted-foreground">No orders in this stage.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const OrderKanban = () => {
  const { data: orders, loading } = useCollection<Order>("orders");

  if (loading) {
    return (
      <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {columns.map(col => (
          <Card key={col.status}>
            <CardHeader><CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle></CardHeader>
            <CardContent className="space-y-4 p-2">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => (
        <KanbanColumn
          key={col.status}
          title={col.title}
          orders={orders}
          status={col.status}
        />
      ))}
    </div>
  );
};

export default OrderKanban;
