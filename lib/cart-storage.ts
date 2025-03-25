import { CartItem, Product } from './types';

interface LocalCartItem {
  productId: string;
  product: Product;
  quantity: number;
}

const CART_STORAGE_KEY = 'cart_items';

export function getLocalCart(): LocalCartItem[] {
  if (typeof window === 'undefined') return [];
  const items = localStorage.getItem(CART_STORAGE_KEY);
  return items ? JSON.parse(items) : [];
}

export function addToLocalCart(product: Product, quantity: number = 1) {
  const cart = getLocalCart();
  const existingItem = cart.find(item => item.productId === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      productId: product.id,
      product,
      quantity
    });
  }

  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  return cart;
}

export function removeFromLocalCart(productId: string) {
  const cart = getLocalCart();
  const updatedCart = cart.filter(item => item.productId !== productId);
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
  return updatedCart;
}

export function clearLocalCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
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