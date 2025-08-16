"use client";

import React, { useState, useTransition } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/lib/types";
import { confirmOrder, cancelOrder, assignAwb } from "@/lib/actions/order";
import { BrainCircuit, Loader2, Printer, Ship, X, Check, MoreHorizontal } from 'lucide-react';
import CarrierSuggestionModal from './carrier-suggestion-modal';

export const OrderRowActions = ({ order }: { order: Order }) => {
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {order.appStatus === 'NEW' && (
            <>
              <DropdownMenuItem onClick={handleConfirm} disabled={isConfirming}>
                {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Confirm Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCancel} disabled={isCancelling} className="text-destructive focus:text-destructive">
                {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                Cancel Order
              </DropdownMenuItem>
            </>
          )}
          {order.appStatus === 'CONFIRMED' && (
            <>
              <DropdownMenuItem onClick={handleAssignAwb} disabled={isAssigning}>
                {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ship className="mr-2 h-4 w-4" />}
                Assign AWB
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsModalOpen(true)}>
                <BrainCircuit className="mr-2 h-4 w-4" />
                Suggest Carrier
              </DropdownMenuItem>
            </>
          )}
          {order.appStatus === 'READY_TO_DISPATCH' && (
            <DropdownMenuItem asChild>
              <a href={order.awb.labelUrl || '#'} target="_blank" rel="noopener noreferrer">
                <Printer className="mr-2 h-4 w-4" />
                Print Label
              </a>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
