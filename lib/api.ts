export async function getProducts({ category, minPrice, maxPrice, search }: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
} = {}) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (minPrice !== undefined) params.append('minPrice', minPrice.toString());
  if (maxPrice !== undefined) params.append('maxPrice', maxPrice.toString());
  if (search) params.append('search', search);

  const response = await fetch(`/api/products?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
}