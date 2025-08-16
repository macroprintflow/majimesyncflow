"use client";

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/lib/types";
import { confirmOrder, cancelOrder, assignAwb } from "@/lib/actions/order";
import { BrainCircuit, Loader2, Printer, Ship, X, Check } from 'lucide-react';
import CarrierSuggestionModal from './carrier-suggestion-modal';

const OrderCard = ({ order }: { order: Order }) => {
  const { toast } = useToast();
  const [isConfirming, startConfirmTransition] = useTransition();
  const [isCancelling, startCancelTransition] = useTransition();
  const [isAssigning, startAssignTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirm = () => {
    startConfirmTransition(async () => {
      const result = await confirmOrder(order.id);
      if (result.success) {
        toast({ title: "Success", description: "Order confirmed." });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  };

  const handleCancel = () => {
    startCancelTransition(async () => {
      const result = await cancelOrder(order.id);
      if (result.success) {
        toast({ title: "Success", description: "Order cancelled." });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  };

  const handleAssignAwb = () => {
    startAssignTransition(async () => {
      const result = await assignAwb(order.id);
      if (result.success) {
        toast({ title: "Success", description: `AWB assigned via ${result.carrier}.` });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  };

  return (
    <>
      <CarrierSuggestionModal order={order} isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base">Order #{order.shopifyId.replace('shp-', '')}</CardTitle>
              <CardDescription>{order.customer.name}</CardDescription>
            </div>
            {order.carrier && (
                 <span className="text-xs font-semibold bg-primary/20 text-primary-foreground px-2 py-1 rounded-full">{order.carrier}</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="flex justify-between">
            <span>{order.lineItems.length} item(s)</span>
            <span className="font-semibold">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: order.totals.currency }).format(order.totals.grandTotal)}
            </span>
          </div>
          <p className="text-muted-foreground mt-2">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
        </CardContent>
        <Separator />
        <CardFooter className="p-2">
          <div className="w-full space-y-2">
            <div className="flex gap-2 w-full">
              {order.appStatus === 'NEW' && (
                <>
                  <Button onClick={handleConfirm} disabled={isConfirming} size="sm" className="w-full">
                    {isConfirming ? <Loader2 className="animate-spin" /> : <Check />} Confirm
                  </Button>
                  <Button onClick={handleCancel} disabled={isCancelling} variant="destructive" size="sm" className="w-full">
                    {isCancelling ? <Loader2 className="animate-spin" /> : <X />} Cancel
                  </Button>
                </>
              )}
              {order.appStatus === 'CONFIRMED' && (
                <Button onClick={handleAssignAwb} disabled={isAssigning} size="sm" className="w-full">
                  {isAssigning ? <Loader2 className="animate-spin" /> : <Ship />} Assign AWB
                </Button>
              )}
              {order.appStatus === 'READY_TO_DISPATCH' && (
                <Button asChild size="sm" variant="secondary" className="w-full">
                  <a href={order.awb.labelUrl || '#'} target="_blank" rel="noopener noreferrer">
                    <Printer /> Print Label
                  </a>
                </Button>
              )}
            </div>
            {order.appStatus === 'CONFIRMED' && (
                <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm" className="w-full">
                    <BrainCircuit /> Suggest Carrier
                </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </>
  );
};

export default OrderCard;
