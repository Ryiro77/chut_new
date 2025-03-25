export async function getProducts({ category, search }: { category?: string; search?: string }) {
  const queryParams = new URLSearchParams();
  if (category) queryParams.append('category', category);
  if (search) queryParams.append('search', search);

  const response = await fetch(`/api/products?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
}