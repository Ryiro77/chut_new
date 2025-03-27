'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Script from 'next/script'
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Container } from "@/components/ui/container"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { CartItem, CheckoutFormData } from '@/lib/types'
import { getCartItems, checkout } from '@/lib/api-client'

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(price)
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void>;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (error: { error: { description: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface OrderResponse {
  success: boolean;
  paymentMethod: 'cod' | 'online';
  order: {
    id: string;
    razorpay?: {
      orderId: string;
      amount: number;
      currency: string;
    };
  };
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'cod'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchCartItems = useCallback(async () => {
    try {
      // Check session status instead of session data
      if (status === 'unauthenticated') {
        router.push('/auth?callbackUrl=/checkout');
        return;
      }

      const data = await getCartItems();
      if (data.length === 0) {
        router.push('/cart');
        return;
      }
      setCartItems(data);
    } catch (error) {
      console.error('Failed to fetch cart items:', error);
      toast.error("Failed to load cart items");
    } finally {
      setLoading(false);
    }
  }, [router, status]);

  useEffect(() => {
    if (status !== 'loading') {
      fetchCartItems();
    }
  }, [fetchCartItems, status]);

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = item.product.isOnSale && item.product.discountedPrice
        ? item.product.discountedPrice
        : item.product.regularPrice;
      return total + (price * item.quantity);
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const errors = { ...prev };
        delete errors[name];
        return errors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields
    const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'pincode'] as const;
    for (const field of requiredFields) {
      if (!formData[field]) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }

    // Phone validation (10 digits)
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      errors.phone = 'Phone number must be 10 digits';
    }

    // Pincode validation (6 digits)
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      errors.pincode = 'Pincode must be 6 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePayment = async (order: OrderResponse['order']) => {
    if (!order.razorpay) return;

    const options: RazorpayOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: order.razorpay.amount,
      currency: order.razorpay.currency,
      name: "Computer Hut",
      description: "Payment for your order",
      order_id: order.razorpay.orderId,
      handler: async (response: RazorpayResponse) => {
        try {
          const data = await fetch('/api/checkout', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (!data.ok) {
            throw new Error('Payment verification failed');
          }

          toast.success("Payment successful! Order placed.");
          router.push('/account/orders');
        } catch (error) {
          console.error('Payment verification failed:', error);
          toast.error("Payment verification failed. Please contact support.");
        }
      },
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone,
      },
      theme: {
        color: "#000000",
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setSubmitting(true);

    try {
      const data = await checkout(cartItems, formData);
      
      if (formData.paymentMethod === 'cod') {
        toast.success("Order placed successfully!");
        router.push('/account/orders');
      } else {
        await handlePayment(data.order);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
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
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      
      <Header />
      
      <main className="flex-1">
        <Container className="py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
            <div>
              <h1 className="text-2xl font-bold mb-6">Checkout</h1>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                        {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                        {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                      {formErrors.phone && <p className="text-red-500 text-sm">{formErrors.phone}</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                      {formErrors.address && <p className="text-red-500 text-sm">{formErrors.address}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                        {formErrors.city && <p className="text-red-500 text-sm">{formErrors.city}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                        />
                        {formErrors.state && <p className="text-red-500 text-sm">{formErrors.state}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                      />
                      {formErrors.pincode && <p className="text-red-500 text-sm">{formErrors.pincode}</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="cod"
                          name="paymentMethod"
                          value="cod"
                          checked={formData.paymentMethod === 'cod'}
                          onChange={handleInputChange}
                          className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="cod">Cash on Delivery</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="online"
                          name="paymentMethod"
                          value="online"
                          checked={formData.paymentMethod === 'online'}
                          onChange={handleInputChange}
                          className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="online">Pay Online</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </div>

            <div className="lg:sticky lg:top-4 space-y-4 h-fit">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            {item.product.isOnSale && item.product.discountedPrice ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">₹{formatPrice(item.product.discountedPrice * item.quantity)}</span>
                                  <span className="text-sm text-muted-foreground line-through">₹{formatPrice(item.product.regularPrice * item.quantity)}</span>
                                </div>
                                <div className="text-sm text-green-600">
                                  {Math.round(item.product.discountPercentage || 0)}% off
                                </div>
                              </>
                            ) : (
                              <span className="font-medium">₹{formatPrice(item.product.regularPrice * item.quantity)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
                    type="submit"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Place Order - ₹${getTotalPrice().toLocaleString()}`
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}