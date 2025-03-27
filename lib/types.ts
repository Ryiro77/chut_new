export interface Product {
  id: string;
  name: string;
  regularPrice: number;
  discountedPrice?: number;
  discountPercentage?: number;
  isOnSale: boolean;
  brand: string;
  description: string;
  category: {
    name: string;
  };
  specs?: Array<{
    name: string;
    value: string;
  }>;
  images: Array<{
    id: string;
    url: string | null;
    filePath: string;
    isMain: boolean;
  }>;
}

export interface CartItem {
  id: string;
  quantity: number;
  product: Product;
  customBuildName?: string | null;
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
  regularPrice?: number | null;
  discountedPrice?: number | null;
  price: number | null;  // Effective price (either discounted or regular)
  brand: string | null;
  image?: string;
  isOnSale?: boolean;
  specs?: Array<{  // Added specs for compatibility checking
    name: string;
    value: string;
    unit?: string | null;
  }>;
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