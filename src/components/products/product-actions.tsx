"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2, UploadCloud, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/types";
import { deleteProduct } from "@/lib/actions/product";

interface ProductActionsProps {
  product: Product;
  onEdit: (product: Product) => void;
}

const ProductActions = ({ product, onEdit }: ProductActionsProps) => {
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteProduct(product.id);
      if (result.success) {
        toast({ title: "Success", description: "Product deleted." });
        setIsDialogOpen(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  };

  const handlePushToShopify = () => {
    // This is a mock action
    toast({ title: "Syncing", description: `Pushing "${product.title}" to Shopify...` });
    setTimeout(() => {
        toast({ title: "Success", description: "Product pushed to Shopify." });
    }, 1500);
  }

  return (
    <>
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product "{product.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="animate-spin" /> : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onEdit(product)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePushToShopify}>
            <UploadCloud className="mr-2 h-4 w-4" /> Push to Shopify
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setIsDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default ProductActions;
