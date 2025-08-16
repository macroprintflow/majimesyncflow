"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { Order } from "@/lib/types";
import { suggestCarrierAction } from "@/lib/actions/order";
import type { SuggestCarrierOutput } from "@/ai/flows/intelligent-carrier-selection";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CarrierSuggestionModalProps {
  order: Order;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const CarrierSuggestionModal = ({ order, isOpen, onOpenChange }: CarrierSuggestionModalProps) => {
  const [destination, setDestination] = useState(`${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.pincode}`);
  const [weight, setWeight] = useState(1); // Default weight
  const [orderDetails, setOrderDetails] = useState(order.lineItems.map(li => `${li.title} (x${li.quantity})`).join(', '));
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SuggestCarrierOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);
    const response = await suggestCarrierAction({ destination, weight, orderDetails });
    if (response.success) {
      setResult(response.data);
    } else {
      setError(response.error);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Intelligent Carrier Selection</DialogTitle>
          <DialogDescription>
            Let AI suggest the best carrier for order #{order.shopifyId.replace('shp-','')} based on the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="destination" className="text-right">
                Destination
              </Label>
              <Input id="destination" value={destination} onChange={e => setDestination(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weight" className="text-right">
                Weight (kg)
              </Label>
              <Input id="weight" type="number" value={weight} onChange={e => setWeight(parseFloat(e.target.value))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="details" className="text-right">
                Order Details
              </Label>
              <Textarea id="details" value={orderDetails} onChange={e => setOrderDetails(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get Suggestion
            </Button>
          </DialogFooter>
        </form>
        {result && (
          <Alert className="mt-4 bg-primary/10 border-primary/50">
            <AlertTitle className="font-bold text-primary">AI Suggestion: {result.carrier}</AlertTitle>
            <AlertDescription>
              {result.reason}
            </AlertDescription>
          </Alert>
        )}
        {error && (
            <Alert variant="destructive" className="mt-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CarrierSuggestionModal;
