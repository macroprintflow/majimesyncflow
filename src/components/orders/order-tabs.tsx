"use client";

import { useCollection } from "@/lib/hooks/use-collection";
import type { Order, OrderAppStatus } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderRowActions } from "./order-row-actions";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";

const columns: { title: string; status: OrderAppStatus }[] = [
  { title: "New Orders", status: "NEW" },
  { title: "Confirmed", status: "CONFIRMED" },
  { title: "Ready to Dispatch", status: "READY_TO_DISPATCH" },
  { title: "Cancelled", status: "CANCELLED" },
];

const OrderTable = ({ orders, status }: { orders: Order[]; status: OrderAppStatus }) => {
  const filteredOrders = orders.filter(order => order.appStatus === status);

  if (filteredOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center mt-4">
        <p className="text-sm text-muted-foreground">No orders in this stage.</p>
      </div>
    );
  }
  
  const formatDate = (timestamp: Timestamp) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return format(timestamp.toDate(), 'PPpp');
    }
    // Fallback for cases where timestamp might not be a valid object
    return 'Invalid date';
  };

  return (
    <div className="rounded-lg border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders.map(order => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">#{order.shopifyId.replace('shp-','').split('?')[0].split('/').pop()}</TableCell>
              <TableCell>{order.customer.name}</TableCell>
              <TableCell>{formatDate(order.createdAt)}</TableCell>
              <TableCell>{order.lineItems.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
              <TableCell className="text-right font-semibold">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: order.totals.currency }).format(order.totals.grandTotal)}
              </TableCell>
              <TableCell>
                <OrderRowActions order={order} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
        <div className="mt-4 space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
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
          <OrderTable orders={orders} status={col.status} />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default OrderTabs;
