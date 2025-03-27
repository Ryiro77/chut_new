'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Container } from "@/components/ui/container"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Trash2, MinusCircle, PlusCircle } from "lucide-react"
import { toast } from "sonner"
import { CartItem } from '@/lib/types'
import { getCartItems, removeFromCart } from '@/lib/api-client'
import { updateLocalCartQuantity } from '@/lib/cart-storage'

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const router = useRouter();

  useEffect(() => {
    fetchCartItems();
  }, []);

  // Initialize quantities when cart items load
  useEffect(() => {
    const initialQuantities: Record<string, number> = {};
    cartItems.forEach(item => {
      initialQuantities[item.id] = item.quantity;
    });
    setQuantities(initialQuantities);
  }, [cartItems]);

  const fetchCartItems = async () => {
    try {
      const data = await getCartItems();
      setCartItems(data);
    } catch (error) {
      console.error('Failed to fetch cart items:', error);
      toast.error("Failed to load cart items");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setRemoving(itemId);
    try {
      await removeFromCart(itemId);
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      toast.success("Item removed from cart");
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast.error("Failed to remove item");
    } finally {
      setRemoving(null);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    // Prevent invalid quantities
    if (newQuantity < 1 || newQuantity > 8) return;

    // Find the item to update
    const itemToUpdate = cartItems.find(item => item.id === itemId);
    if (!itemToUpdate) return;

    // Update local quantity state immediately for responsiveness
    setQuantities(prev => ({
      ...prev,
      [itemId]: newQuantity
    }));

    setUpdating(itemId);
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItemId: itemId,
          quantity: newQuantity,
        }),
      });

      const data = await response.json();
      
      if (!response.ok && response.status !== 401) {
        // Revert quantity on error
        setQuantities(prev => ({
          ...prev,
          [itemId]: itemToUpdate.quantity
        }));
        throw new Error(data.error || 'Failed to update quantity');
      }

      // Update local storage if unauthorized or using local cart
      if (response.status === 401) {
        updateLocalCartQuantity(itemToUpdate.product.id, newQuantity);
        
        // Update UI state
        setCartItems(prev => prev.map(cartItem => 
          cartItem.id === itemId ? {
            ...cartItem,
            quantity: newQuantity
          } : cartItem
        ));
      } else {
        // Regular server-side update - update UI with server response
        setCartItems(prev => prev.map(item => 
          item.id === data.id ? {
            ...item,
            ...data,
            product: {
              ...item.product,
              ...data.product
            }
          } : item
        ));
      }
      toast.success("Quantity updated");
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update quantity");
    } finally {
      setUpdating(null);
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = item.product.isOnSale && item.product.discountedPrice
        ? item.product.discountedPrice
        : item.product.regularPrice;
      return total + (price * item.quantity);
    }, 0);
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Container className="py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <Container className="py-8">
          <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
          
          {cartItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">Your cart is empty</p>
                <Button onClick={() => router.push('/products')}>
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="font-medium">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.product.brand}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <label className="text-sm">Quantity:</label>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleUpdateQuantity(item.id, quantities[item.id] - 1)}
                                disabled={quantities[item.id] <= 1 || updating === item.id}
                              >
                                <MinusCircle className="h-4 w-4" />
                              </Button>
                              <Input
                                type="number"
                                min={1}
                                max={8}
                                value={quantities[item.id] || item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val) && val >= 1 && val <= 8) {
                                    handleUpdateQuantity(item.id, val);
                                  }
                                }}
                                className="w-16 text-center h-8"
                                disabled={updating === item.id}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleUpdateQuantity(item.id, quantities[item.id] + 1)}
                                disabled={quantities[item.id] >= 8 || updating === item.id}
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                              {updating === item.id && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )}
                            </div>
                          </div>
                          {item.product.specs && item.product.specs.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {item.product.specs.map((spec, index) => (
                                <p key={index} className="text-sm">
                                  {spec.name}: {spec.value}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          {item.product.isOnSale && item.product.discountedPrice ? (
                            <>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">₹{(item.product.discountedPrice * item.quantity).toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground line-through">
                                  ₹{(item.product.regularPrice * item.quantity).toLocaleString()}
                                </p>
                              </div>
                              <div className="text-sm text-green-600">
                                {Math.round(((item.product.regularPrice - item.product.discountedPrice) / item.product.regularPrice) * 100)}% off
                              </div>
                            </>
                          ) : (
                            <p className="font-medium">₹{(item.product.regularPrice * item.quantity).toLocaleString()}</p>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={removing === item.id}
                          >
                            {removing === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="lg:sticky lg:top-4 space-y-4 h-fit">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{getTotalPrice().toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>₹{getTotalPrice().toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleCheckout}
                    >
                      Proceed to Checkout
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}