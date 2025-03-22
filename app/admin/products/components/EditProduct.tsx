'use client'

import { useEffect, useState } from 'react'
import { getProduct, updateProduct } from '../actions'

const componentTypes = ['CPU', 'GPU', 'MOTHERBOARD', 'RAM', 'STORAGE', 'PSU', 'CASE', 'COOLER', 'OTHER'] as const

type Product = {
  id: string
  name: string
  description: string
  price: number
  stock: number
  brand: string
  sku: string
  categoryId: string
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    description?: string | null
    slug: string
    parentId?: string | null
    icon?: string | null
    featured: boolean
    sortOrder: number
  }
}

export default function EditProduct({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await getProduct(productId)
        if (data) {
          setProduct(data as Product)
        } else {
          setError('Product not found')
        }
      } catch (error) {
        setError('Failed to load product')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [productId])

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!product) return <div>Product not found</div>

  async function handleSubmit(formData: FormData) {
    if (!product) return
    try {
      await updateProduct(product.id, formData)
    } catch (error) {
      console.error('Failed to update product:', error)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Edit Product</h2>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block mb-1">Product Name</label>
          <input type="text" id="name" name="name" required 
            defaultValue={product.name}
            className="w-full p-2 border rounded" />
        </div>

        <div>
          <label htmlFor="sku" className="block mb-1">SKU</label>
          <input type="text" id="sku" name="sku" required 
            defaultValue={product.sku}
            className="w-full p-2 border rounded" />
        </div>

        <div>
          <label htmlFor="description" className="block mb-1">Description</label>
          <textarea id="description" name="description" required 
            defaultValue={product.description}
            className="w-full p-2 border rounded" rows={3} />
        </div>

        <div>
          <label htmlFor="price" className="block mb-1">Price</label>
          <input type="number" id="price" name="price" step="0.01" required 
            defaultValue={product.price}
            className="w-full p-2 border rounded" />
        </div>

        <div>
          <label htmlFor="stock" className="block mb-1">Stock</label>
          <input type="number" id="stock" name="stock" required 
            defaultValue={product.stock}
            className="w-full p-2 border rounded" />
        </div>

        <div>
          <label htmlFor="brand" className="block mb-1">Brand</label>
          <input type="text" id="brand" name="brand" required 
            defaultValue={product.brand}
            className="w-full p-2 border rounded" />
        </div>

        <div>
          <label htmlFor="componentType" className="block mb-1">Component Type</label>
          <select id="componentType" name="componentType" required 
            defaultValue={product.category.name}
            className="w-full p-2 border rounded">
            <option value="">Select a component type</option>
            {componentTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" 
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Update Product
        </button>
      </form>
    </div>
  )
}