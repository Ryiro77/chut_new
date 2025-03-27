import { CartItem, Product } from './types';

interface LocalCartItem {
  productId: string;
  product: Product;
  quantity: number;
}

const CART_STORAGE_KEY = 'cart_items';

export function getLocalCart(): LocalCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const items = localStorage.getItem(CART_STORAGE_KEY);
    return items ? JSON.parse(items) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

export function addToLocalCart(product: Product, quantity: number = 1) {
  if (typeof window === 'undefined') return [];
  
  try {
    const cart = getLocalCart();
    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      // Calculate new quantity but respect the limit of 8
      const newQuantity = Math.min(existingItem.quantity + quantity, 8);
      existingItem.quantity = newQuantity;
      existingItem.product = product;
    } else {
      // For new items, ensure quantity doesn't exceed 8
      cart.push({
        productId: product.id,
        product,
        quantity: Math.min(quantity, 8)
      });
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    return cart;
  } catch (error) {
    console.error('Error adding to localStorage:', error);
    return [];
  }
}

export function updateLocalCartQuantity(productId: string, quantity: number) {
  if (typeof window === 'undefined') return [];
  
  try {
    const cart = getLocalCart();
    const item = cart.find(item => item.productId === productId);
    
    if (item) {
      // Ensure quantity doesn't exceed 8 and isn't less than 1
      item.quantity = Math.max(1, Math.min(quantity, 8));
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
    
    return cart;
  } catch (error) {
    console.error('Error updating localStorage:', error);
    return [];
  }
}

export function removeFromLocalCart(productId: string) {
  if (typeof window === 'undefined') return [];
  
  try {
    const cart = getLocalCart();
    const updatedCart = cart.filter(item => item.productId !== productId);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
    return updatedCart;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return [];
  }
}

export function clearLocalCart() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

export function syncLocalCartWithServer(serverCart: CartItem[]) {
  const localCart = getLocalCart();
  
  // If there are no local items, nothing to sync
  if (localCart.length === 0) return [];

  // Find items that exist in local cart but not in server cart
  const itemsToAdd = localCart.filter(localItem => 
    !serverCart.some(serverItem => 
      serverItem.product.id === localItem.productId
    )
  );

  // Clear local cart after getting items to sync
  clearLocalCart();
  
  return itemsToAdd;
}