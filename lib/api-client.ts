import { CartItem, CheckoutFormData, Product } from './types';
import { getLocalCart, addToLocalCart, removeFromLocalCart } from './cart-storage';

export async function getProducts({ category, search, minPrice, maxPrice, filters }: { 
  category?: string; 
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  filters?: Record<string, string[]>;
}) {
  const params = new URLSearchParams();
  
  if (category) params.append('category', category);
  if (search) params.append('search', search);
  if (minPrice !== undefined) params.append('minPrice', minPrice.toString());
  if (maxPrice !== undefined) params.append('maxPrice', maxPrice.toString());
  if (filters) params.append('filters', JSON.stringify(filters));
  
  try {
    const response = await fetch(`/api/products?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function getCartItems(): Promise<CartItem[]> {
  try {
    const response = await fetch('/api/cart');
    
    if (response.status === 401) {
      // If unauthorized, return local cart items
      return getLocalCart().map(item => ({
        id: item.productId,
        product: item.product,
        quantity: item.quantity
      }));
    }
    
    const data = await response.json();
    
    // If the response is an error or not an array, return empty array
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data;
  } catch (err) {
    console.error('Failed to fetch server cart, falling back to local cart:', err);
    // On error, fall back to local cart
    return getLocalCart().map(item => ({
      id: item.productId,
      product: item.product,
      quantity: item.quantity
    }));
  }
}

export async function removeFromCart(itemId: string) {
  try {
    const response = await fetch(`/api/cart?id=${itemId}`, {
      method: 'DELETE',
    });

    if (response.status === 401) {
      // If unauthorized, remove from local cart instead
      removeFromLocalCart(itemId);
      return;
    }

    // Check if the response is successful (status in 200-299 range)
    if (response.ok) {
      return;
    }

    // Only try to parse error response if there's content
    const text = await response.text();
    if (text) {
      const error = JSON.parse(text);
      throw new Error(error.error || 'Failed to remove item');
    } else {
      throw new Error('Failed to remove item');
    }
  } catch (err) {
    // If server request fails, try removing from local cart
    console.error('Failed to remove item from server cart:', err);
    removeFromLocalCart(itemId);
  }
}

export async function addToCart(items: Pick<Product, 'id' | 'name' | 'brand' | 'regularPrice' | 'discountedPrice' | 'isOnSale'>[], isCustomBuild?: boolean, customBuildName?: string) {
  try {
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: items.map(item => ({
          ...item,
          price: item.isOnSale && item.discountedPrice ? item.discountedPrice : item.regularPrice
        })),
        isCustomBuild,
        customBuildName,
      }),
    });

    if (response.status === 401) {
      // If unauthorized, add to local cart instead
      items.forEach(item => addToLocalCart(item as Product));
      return items;
    }

    if (!response.ok) {
      throw new Error('Failed to add to cart');
    }
    return response.json();
  } catch (err) {
    // If server request fails, add to local cart
    console.error('Failed to add to server cart:', err);
    items.forEach(item => addToLocalCart(item as Product));
    return items;
  }
}

export async function checkout(items: CartItem[], shippingDetails: CheckoutFormData) {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: items.map(item => ({
        id: item.product.id,
        quantity: item.quantity,
        price: item.product.isOnSale && item.product.discountedPrice 
          ? item.product.discountedPrice 
          : item.product.regularPrice
      })),
      shippingDetails,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to place order');
  }

  return response.json();
}