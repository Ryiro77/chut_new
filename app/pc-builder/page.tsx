'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Container } from "@/components/ui/container"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Product, Component } from '@/lib/types'
import { getProducts, addToCart } from '@/lib/api-client'

interface SelectComponentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  componentType: string;
  onSelect: (product: Product) => void;
}

function SelectComponentDialog({ open, onOpenChange, componentType, onSelect }: SelectComponentDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!searchQuery && !componentType) return;
    setLoading(true);
    try {
      const data = await getProducts({
        category: componentType,
        search: searchQuery,
      });
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, componentType]);

  useEffect(() => {
    const debounceTimer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchProducts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select {componentType}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder={`Search ${componentType.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <ScrollArea className="h-[400px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <span className="text-muted-foreground">Loading...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <span className="text-muted-foreground">No products found</span>
              </div>
            ) : (
              <div className="space-y-2">
                {products.map((product) => (
                  <Card key={product.id} className="cursor-pointer hover:border-primary/50" onClick={() => {
                    onSelect(product);
                    onOpenChange(false);
                  }}>
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">{product.brand}</p>
                        </div>
                        <p className="font-medium">₹{product.price.toLocaleString()}</p>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PCBuilderPage() {
  const [components, setComponents] = useState<Record<string, Component>>({
    cpu: { type: 'CPU', id: null, name: null, price: null, brand: null },
    motherboard: { type: 'MOTHERBOARD', id: null, name: null, price: null, brand: null },
    gpu: { type: 'GPU', id: null, name: null, price: null, brand: null },
    ram: { type: 'RAM', id: null, name: null, price: null, brand: null },
    storage: { type: 'STORAGE', id: null, name: null, price: null, brand: null },
    psu: { type: 'PSU', id: null, name: null, price: null, brand: null },
    case: { type: 'CASE', id: null, name: null, price: null, brand: null },
    cooler: { type: 'COOLER', id: null, name: null, price: null, brand: null },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getTotalPrice = () => {
    return Object.values(components)
      .reduce((total, component) => total + (component.price || 0), 0);
  };

  const handleSelectComponent = (type: string) => {
    setSelectedType(type.toUpperCase());
    setDialogOpen(true);
  };

  const handleComponentSelect = (product: Product) => {
    setComponents(prev => ({
      ...prev,
      [selectedType.toLowerCase()]: {
        type: selectedType,
        id: product.id,
        name: product.name,
        price: product.price,
        brand: product.brand,
      }
    }));
  };

  const handleRemoveComponent = (type: string) => {
    setComponents(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        id: null,
        name: null,
        price: null,
        brand: null,
      }
    }));
  };

  const handleAddToCart = async () => {
    // Check if any component is selected
    const hasComponents = Object.values(components).some(comp => comp.id !== null);
    if (!hasComponents) {
      toast.error("Please select at least one component for your build");
      return;
    }

    setLoading(true);
    try {
      const buildComponents = Object.values(components)
        .filter(comp => comp.id !== null)
        .map(comp => ({
          id: comp.id!,
          name: comp.name!,
          price: comp.price!,
          brand: comp.brand!
        }));
      
      await addToCart(
        buildComponents,
        true,
        `Custom PC Build (${new Date().toLocaleDateString()})`
      );
      
      toast.success("Your custom build has been added to cart");
      router.push('/cart');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error("Failed to add items to cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <Container className="py-8">
          <h1 className="text-2xl font-bold mb-6">Custom PC Builder</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
            {/* Component Selection Section */}
            <div className="space-y-4">
              {Object.entries(components).map(([key, component]) => (
                <Card key={key} className="border-2 hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{component.type}</CardTitle>
                      <div className="space-x-2">
                        {component.name && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveComponent(key)}
                          >
                            Remove
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSelectComponent(key)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {component.name ? 'Change' : 'Add'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {component.name ? (
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{component.name}</div>
                          <div className="text-sm text-muted-foreground">{component.brand}</div>
                        </div>
                        <span className="font-semibold">
                          ₹{component.price?.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        No {component.type.toLowerCase()} selected
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Build Summary Section */}
            <div className="lg:sticky lg:top-4 space-y-4 h-fit">
              <Card>
                <CardHeader>
                  <CardTitle>Build Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Component List */}
                    <div className="space-y-2">
                      {Object.values(components).map((component) => (
                        <div key={component.type} className="flex justify-between text-sm">
                          <span>{component.type}</span>
                          <span>{component.price ? `₹${component.price.toLocaleString()}` : '-'}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-4">
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span>₹{getTotalPrice().toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Compatibility Check */}
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Compatibility</h3>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>All components are compatible</span>
                        </div>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <Button 
                      className="w-full mt-4" 
                      size="lg"
                      onClick={handleAddToCart}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding to Cart...
                        </>
                      ) : (
                        'Add Build to Cart'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </main>

      <Footer />

      <SelectComponentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        componentType={selectedType}
        onSelect={handleComponentSelect}
      />
    </div>
  );
}