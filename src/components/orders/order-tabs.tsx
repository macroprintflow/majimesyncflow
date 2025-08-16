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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderRowActions } from "./order-row-actions";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { useState } from "react";

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

type SortOrder = "desc" | "asc";

const OrderTable = ({
  orders,
  status,
}: {
  orders: Order[];
  status: OrderAppStatus;
}) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const filteredOrders = orders.filter((order) => order.appStatus === status);

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = isFirestoreTimestamp(a.createdAt) ? a.createdAt.toDate().getTime() : 0;
    const dateB = isFirestoreTimestamp(b.createdAt) ? b.createdAt.toDate().getTime() : 0;
    if (sortOrder === "desc") {
      return dateB - dateA;
    }
    return dateA - dateB;
  });

  if (sortedOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center mt-4">
        <p className="text-sm text-muted-foreground">No orders in this stage.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mt-4">
          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
      </div>
      <div className="rounded-lg border mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date (Shopify)</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
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
