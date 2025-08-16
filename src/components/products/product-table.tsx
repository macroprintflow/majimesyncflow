"use client";

import { useCollection } from "@/lib/hooks/use-collection";
import type { Product } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import ProductActions from "./product-actions";
import { useState } from "react";
import ProductForm from "./product-form";
import { seedData } from "@/lib/actions/product";
import { useToast } from "@/hooks/use-toast";

const ProductTable = () => {
  const { data: products, loading } = useCollection<Product>("products");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };
  
  const handleAddNew = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleSeed = async () => {
    const res = await seedData();
    if(res.success) {
        toast({ title: "Success", description: "Sample data added successfully." });
    } else {
        toast({ title: "Error", description: res.error, variant: 'destructive' });
    }
  }

  return (
    <>
      <ProductForm 
        isOpen={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        product={selectedProduct}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Products</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSeed}>Seed Data</Button>
            <Button onClick={handleAddNew}>Add New Product</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead>Price</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))}
              {!loading && products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.title}</TableCell>
                  <TableCell>
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className={product.status === 'active' ? 'bg-green-600' : ''}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{product.variants[0]?.sku}</TableCell>
                  <TableCell>{product.variants[0]?.inventoryQty}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.variants[0]?.price || 0)}
                  </TableCell>
                  <TableCell>
                    <ProductActions product={product} onEdit={handleEdit} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {!loading && products.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    No products found. Add a new product to get started.
                </div>
           )}
        </CardContent>
      </Card>
    </>
  );
};

export default ProductTable;
