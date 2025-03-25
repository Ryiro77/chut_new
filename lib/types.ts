export interface Product {
  id: string;
  name: string;
  price: number;
  brand: string;
  description: string;
  category: {
    name: string;
  };
  specs?: Array<{
    name: string;
    value: string;
  }>;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: 'cod' | 'online';
}

export interface Component {
  type: string;
  id: string | null;
  name: string | null;
  price: number | null;
  brand: string | null;
}

export interface Order {
  id: string;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: Date;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'COD';