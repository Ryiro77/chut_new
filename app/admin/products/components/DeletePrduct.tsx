'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchProducts, deleteProduct } from "../actions";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: {
    name: string;
  };
};

export default function DeleteProduct() {
  const [products, setProducts] = useState<Product[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    // Load all products on component mount
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      // Search with empty string to get all products
      const results = await searchProducts("");
      setProducts(results);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error("Failed to load products");
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }

    setDeleting(productId);
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error("Failed to delete product");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card className="p-4">
      <h2 className="text-xl font-bold mb-4">Delete Products</h2>
      <ScrollArea className="h-[70vh]">
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50"
            >
              <div>
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-muted-foreground">
                  SKU: {product.sku} • Brand: {product.brand} • Category: {product.category.name}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(product.id)}
                disabled={deleting === product.id}
              >
                {deleting === product.id ? "Deleting..." : "Delete"}
              </Button>
            </div>
          ))}
          {products.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No products found
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}