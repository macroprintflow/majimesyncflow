"use client";

import { useCollection } from "@/lib/hooks/use-collection";
import type { Order, OrderAppStatus } from "@/lib/types";
import OrderCard from "./order-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const columns: { title: string; status: OrderAppStatus }[] = [
  { title: "New Orders", status: "NEW" },
  { title: "Confirmed", status: "CONFIRMED" },
  { title: "Ready to Dispatch", status: "READY_TO_DISPATCH" },
  { title: "Cancelled", status: "CANCELLED" },
];

const OrderList = ({ orders, status }: { orders: Order[]; status: OrderAppStatus }) => {
  const filteredOrders = orders.filter(order => order.appStatus === status);

  if (filteredOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center mt-4">
        <p className="text-sm text-muted-foreground">No orders in this stage.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mt-4">
      {filteredOrders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
};

const OrderTabs = () => {
  const { data: orders, loading } = useCollection<Order>("orders");

  if (loading) {
    return (
      <div>
        <div className="flex space-x-4 border-b">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mt-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }
  
  const getCount = (status: OrderAppStatus) => {
    return orders.filter(o => o.appStatus === status).length;
  }

  return (
    <Tabs defaultValue="NEW" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        {columns.map((col) => (
          <TabsTrigger key={col.status} value={col.status}>
            {col.title} ({getCount(col.status)})
          </TabsTrigger>
        ))}
      </TabsList>
      {columns.map((col) => (
        <TabsContent key={col.status} value={col.status}>
          <OrderList orders={orders} status={col.status} />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default OrderTabs;
