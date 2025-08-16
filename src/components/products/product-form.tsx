"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Product } from "@/lib/types";
import { upsertProduct } from "@/lib/actions/product";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ProductFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
}

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().optional(),
  status: z.enum(["active", "draft", "archived"]),
  sku: z.string().min(1, "SKU is required."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  inventoryQty: z.coerce.number().int().min(0, "Inventory must be a whole number."),
});

const ProductForm = ({ isOpen, onOpenChange, product }: ProductFormProps) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
      sku: "",
      price: 0,
      inventoryQty: 0,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        title: product.title,
        description: product.description,
        status: product.status,
        sku: product.variants[0]?.sku || "",
        price: product.variants[0]?.price || 0,
        inventoryQty: product.variants[0]?.inventoryQty || 0,
      });
    } else {
      form.reset();
    }
  }, [product, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      const productData = {
        title: values.title,
        description: values.description || '',
        status: values.status,
        source: product?.source || 'app',
        shopifyId: product?.shopifyId,
        variants: [{
          sku: values.sku,
          price: values.price,
          inventoryQty: values.inventoryQty,
          optionValues: 'Default',
        }],
        images: [],
        tags: [],
      };
      
      const result = await upsertProduct(productData, product?.id);

      if (result.success) {
        toast({ title: "Success", description: `Product ${product ? 'updated' : 'created'}.` });
        onOpenChange(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Create New Product"}</DialogTitle>
          <DialogDescription>
            {product ? "Update the details for this product." : "Fill in the details for the new product."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="sku" render={({ field }) => (
                <FormItem className="col-span-1"><FormLabel>SKU</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem className="col-span-1"><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="inventoryQty" render={({ field }) => (
                <FormItem className="col-span-1"><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
