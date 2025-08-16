"use client";

import * as React from "react";
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
import { Button } from "@/components/ui/button";
import { OrderRowActions } from "./order-row-actions";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { useState, useMemo } from "react";
import { ArrowUpDown } from "lucide-react";

const columns: { title: string; status: OrderAppStatus }[] = [
  { title: "New Orders", status: "NEW" },
  { title: "Confirmed", status: "CONFIRMED" },
  { title: "Ready to Dispatch", status: "READY_TO_DISPATCH" },
  { title: "Cancelled", status: "CANCELLED" },
];

// Type guard for Firestore Timestamp
function isFirestoreTimestamp(value: any): value is Timestamp {
  return value && typeof value.toDate === "function";
}

// Format a Firestore Timestamp (or show em dash if missing)
function formatDate(ts: any) {
  if (isFirestoreTimestamp(ts)) {
    try {
      return format(ts.toDate(), "PPpp");
    } catch {
      // fall through
    }
  }
  return "—";
}

// Prefer Shopify human order number (order.name like "#OWR-MT11008"),
// else fall back to the numeric part of shopifyId (e.g., shp-1234567890 → #1234567890),
// else the Firestore doc id.
function getDisplayOrderNumber(order: Order) {
  if (order.name) return order.name;
  if (order.shopifyId) {
    const raw = order.shopifyId.replace("shp-", "");
    const cleaned = raw.split("?")[0].split("/").pop() || raw;
    return `#${cleaned}`;
  }
  return `#${order.id}`;
}

type SortConfig = {
    key: keyof Order | 'customer.name' | 'totals.grandTotal' | 'lineItems';
    direction: 'asc' | 'desc';
};

const OrderTable = ({
  orders,
  status,
}: {
  orders: Order[];
  status: OrderAppStatus;
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const filteredOrders = orders.filter((order) => order.appStatus === status);

  const requestSort = (key: SortConfig['key']) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortableHeader = (label: string, key: SortConfig['key']) => (
    <Button variant="ghost" onClick={() => requestSort(key)} className="px-0 hover:bg-transparent">
        {label}
        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortConfig.key !== key && 'text-muted-foreground/50'}`} />
    </Button>
  );


  const sortedOrders = useMemo(() => {
    const sortableItems = [...filteredOrders];
    sortableItems.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'customer.name') {
            aValue = a.customer?.name || '';
            bValue = b.customer?.name || '';
        } else if (sortConfig.key === 'totals.grandTotal') {
            aValue = a.totals?.grandTotal || 0;
            bValue = b.totals?.grandTotal || 0;
        } else if (sortConfig.key === 'createdAt') {
            aValue = isFirestoreTimestamp(a.createdAt) ? a.createdAt.toDate().getTime() : 0;
            bValue = isFirestoreTimestamp(b.createdAt) ? b.createdAt.toDate().getTime() : 0;
        } else {
            aValue = a[sortConfig.key as keyof Order] || '';
            bValue = b[sortConfig.key as keyof Order] || '';
        }

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
    return sortableItems;
  }, [filteredOrders, sortConfig]);

  if (sortedOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center mt-4">
        <p className="text-sm text-muted-foreground">No orders in this stage.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{getSortableHeader('Order', 'name')}</TableHead>
              <TableHead>{getSortableHeader('Customer', 'customer.name')}</TableHead>
              <TableHead>{getSortableHeader('Date (Shopify)', 'createdAt')}</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">{getSortableHeader('Total', 'totals.grandTotal')}</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.map((order) => {
              const humanNumber = getDisplayOrderNumber(order);

              const itemsCount = Array.isArray(order.lineItems)
                ? order.lineItems.reduce((acc, item) => acc + (item.quantity || 0), 0)
                : 0;

              const displayTimestamp = order.createdAt;
              const currency = order?.totals?.currency || "INR";
              const totalAmount = Number(order?.totals?.grandTotal || 0);

              return (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{humanNumber}</TableCell>
                  <TableCell>{order.customer?.name || "—"}</TableCell>
                  <TableCell>{formatDate(displayTimestamp)}</TableCell>
                  <TableCell>{itemsCount}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency,
                    }).format(totalAmount)}
                  </TableCell>
                  <TableCell>
                    <OrderRowActions order={order} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
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

  const getCount = (status: OrderAppStatus) =>
    orders.filter((o) => o.appStatus === status).length;

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
