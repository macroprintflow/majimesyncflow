"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Order } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OrderDetailsModalProps {
  order: Order;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const OrderDetailsModal = ({ order, isOpen, onOpenChange }: OrderDetailsModalProps) => {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: order.totals.currency,
    }).format(amount);
  };

  const getStatusVariant = (status: Order['appStatus']) => {
    switch (status) {
      case 'NEW': return 'default';
      case 'CONFIRMED': return 'secondary';
      case 'READY_TO_DISPATCH': return 'default';
      case 'CANCELLED': return 'destructive';
      default: return 'outline';
    }
  }

  const getStatusClass = (status: Order['appStatus']) => {
     switch (status) {
      case 'NEW': return 'bg-blue-500';
      case 'CONFIRMED': return 'bg-yellow-500';
      case 'READY_TO_DISPATCH': return 'bg-green-500';
      default: return '';
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            Viewing full details for order {order.name}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
        <div className="grid gap-6 p-4 pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Customer</h3>
              <p className="text-sm">{order.customer.name}</p>
              <p className="text-sm text-muted-foreground">{order.customer.email}</p>
              <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Shipping Address</h3>
              <p className="text-sm">{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p className="text-sm">{order.shippingAddress.line2}</p>}
              <p className="text-sm">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
              <p className="text-sm">{order.shippingAddress.country}</p>
            </div>
          </div>
          
          <div>
              <h3 className="font-semibold mb-2">Status</h3>
              <div className="flex gap-2">
                <Badge variant={getStatusVariant(order.appStatus)} className={getStatusClass(order.appStatus)}>{order.appStatus}</Badge>
                <Badge variant="outline">Fulfillment: {order.fulfillmentStatus}</Badge>
                <Badge variant="outline">Payment: {order.financialStatus}</Badge>
              </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.lineItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.sku || 'N/A'}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatCurrency(order.totals.shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(order.totals.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>- {formatCurrency(order.totals.discount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Grand Total</span>
                <span>{formatCurrency(order.totals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;
