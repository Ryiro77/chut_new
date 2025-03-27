import { CartItem, CheckoutFormData, Product } from './types';
import { getLocalCart, addToLocalCart, removeFromLocalCart, syncLocalCartWithServer } from './cart-storage';

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
      // For unauthorized users, convert local cart items to CartItem format
      return getLocalCart().map(item => ({
        id: item.productId, // Use productId as the cart item id for local storage
        product: item.product,
        quantity: item.quantity
      }));
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch cart items');
    }
    
    const data = await response.json();
    
    // If no server-side items, return local cart
    if (!Array.isArray(data) || data.length === 0) {
      return getLocalCart().map(item => ({
        id: item.productId,
        product: item.product,
        quantity: item.quantity
      }));
    }
    
    // If there are server items, sync any local items and clear local storage
    const localItemsToSync = syncLocalCartWithServer(data);
    
    // If there are local items to sync, add them to the server cart
    if (localItemsToSync.length > 0) {
      await addToCart(
        localItemsToSync.map(item => ({
          id: item.product.id,
          name: item.product.name,
          brand: item.product.brand,
          regularPrice: item.product.regularPrice,
          discountedPrice: item.product.discountedPrice,
          isOnSale: item.product.isOnSale
        })),
        1
      );
    }
    
    return data;
  } catch (err) {
    console.error('Failed to fetch cart items:', err);
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
      // For unauthorized users, handle local cart
      const item = getLocalCart().find(item => item.productId === itemId);
      if (item) {
        removeFromLocalCart(item.productId);
      }
      return;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove item');
    }
  } catch (err) {
    console.error('Failed to remove from cart:', err);
    // Try removing from local cart as fallback
    const item = getLocalCart().find(item => item.productId === itemId);
    if (item) {
      removeFromLocalCart(item.productId);
    }
    throw err;
  }
}

export async function addToCart(
  items: Pick<Product, 'id' | 'name' | 'brand' | 'regularPrice' | 'discountedPrice' | 'isOnSale'>[],
  quantity: number = 1,
  isCustomBuild?: boolean,
  customBuildName?: string
) {
  try {
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: items.map(item => ({
          id: item.id,
          quantity,
          customBuildName
        }))
      }),
    });

    if (response.status === 401) {
      // For unauthorized users, add to local cart
      items.forEach(item => addToLocalCart(item as Product, quantity));
      return items;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add to cart');
    }

    return response.json();
  } catch (err) {
    console.error('Failed to add to cart:', err);
    // Add to local cart as fallback
    items.forEach(item => addToLocalCart(item as Product, quantity));
    throw err;
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
        product: {
          id: item.product.id,
          regularPrice: item.product.regularPrice,
          discountedPrice: item.product.discountedPrice,
          isOnSale: item.product.isOnSale
        },
        quantity: item.quantity
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