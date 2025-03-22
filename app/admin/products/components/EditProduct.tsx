'use client'

import { useEffect, useState } from 'react'
import { getProduct, updateProduct } from '../actions'
import Image from 'next/image'

const componentTypes = ['CPU', 'GPU', 'MOTHERBOARD', 'RAM', 'STORAGE', 'PSU', 'CASE', 'COOLER', 'OTHER'] as const

type Spec = {
  id?: string
  name: string
  value: string
  unit?: string | null
  groupName?: string | null
  isHighlight?: boolean
  sortOrder?: number
}

type ProductImage = {
  id: string;
  filePath: string;
  url?: string | null;
  isMain: boolean;
  size?: number | null;
  mimeType?: string | null;
};

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
  specs: Spec[]
  images: ProductImage[]
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
  const [specs, setSpecs] = useState<Spec[]>([])
  const [success, setSuccess] = useState(false)
  const [images, setImages] = useState<ProductImage[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [mainImageId, setMainImageId] = useState<string | null>(null)

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await getProduct(productId)
        if (data) {
          setProduct(data as Product)
          setSpecs(data.specs || [])
          setImages(data.images || [])
          const mainImage = data.images?.find(img => img.isMain)
          setMainImageId(mainImage?.id || null)
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setImageFiles(prev => [...prev, ...files])
  }

  const handleRemoveImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
    if (mainImageId === imageId) {
      setMainImageId(null)
    }
  }

  const handleSetMainImage = (imageId: string) => {
    setMainImageId(imageId)
    setImages(prev => prev.map(img => ({
      ...img,
      isMain: img.id === imageId
    })))
  }

  async function handleSubmit(formData: FormData) {
    if (!product) return
    try {
      setSuccess(false)
      
      // Add specs to form data
      formData.append('specs', JSON.stringify(specs))
      
      // Add existing images with updated main image status
      formData.append('existingImages', JSON.stringify(images))
      
      // Add new images
      imageFiles.forEach((file, index) => {
        formData.append(`image${index}`, file)
      })

      await updateProduct(product.id, formData)
      setSuccess(true)
      setImageFiles([]) // Clear uploaded files after successful update
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update product:', error)
      setError('Failed to update product')
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000)
    }
  }

  function addSpec() {
    setSpecs([...specs, { 
      name: '', 
      value: '', 
      unit: null, 
      groupName: null, 
      isHighlight: false,
      sortOrder: specs.length
    }])
  }

  function removeSpec(index: number) {
    setSpecs(specs.filter((_, i) => i !== index))
  }

  function updateSpec(index: number, field: keyof Spec, value: string | boolean | null) {
    const newSpecs = [...specs]
    newSpecs[index] = { ...newSpecs[index], [field]: value }
    setSpecs(newSpecs)
  }

  if (!product || loading) return <div className="animate-pulse">Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Edit Product</h2>
      <form action={handleSubmit} className="space-y-4">
        {/* Basic product fields section */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block mb-1">Product Name</label>
            <input type="text" id="name" name="name" required 
              defaultValue={product?.name}
              className="w-full p-2 border rounded" />
          </div>

          <div>
            <label htmlFor="sku" className="block mb-1">SKU</label>
            <input type="text" id="sku" name="sku" required 
              defaultValue={product?.sku}
              className="w-full p-2 border rounded" />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block mb-1">Description</label>
          <textarea id="description" name="description" required 
            defaultValue={product?.description}
            className="w-full p-2 border rounded" rows={3} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block mb-1">Price</label>
            <input type="number" id="price" name="price" step="0.01" required 
              defaultValue={product?.price}
              className="w-full p-2 border rounded" />
          </div>

          <div>
            <label htmlFor="stock" className="block mb-1">Stock</label>
            <input type="number" id="stock" name="stock" required 
              defaultValue={product?.stock}
              className="w-full p-2 border rounded" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="brand" className="block mb-1">Brand</label>
            <input type="text" id="brand" name="brand" required 
              defaultValue={product?.brand}
              className="w-full p-2 border rounded" />
          </div>

          <div>
            <label htmlFor="componentType" className="block mb-1">Component Type</label>
            <select id="componentType" name="componentType" required 
              defaultValue={product?.category.name}
              className="w-full p-2 border rounded">
              <option value="">Select a component type</option>
              {componentTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Images section */}
        <div className="space-y-4 mt-8">
          <div className="flex justify-between items-center">
            <label className="text-lg font-medium">Product Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
              id="imageUpload"
            />
            <label
              htmlFor="imageUpload"
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer"
            >
              Add Images
            </label>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* Existing images */}
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square relative border rounded overflow-hidden">
                  <Image
                    src={image.url || image.filePath}
                    alt="Product"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(image.id)}
                    className="p-1 bg-red-500 text-white rounded-full mr-2"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetMainImage(image.id)}
                    className={`p-1 ${image.isMain ? 'bg-yellow-500' : 'bg-blue-500'} text-white rounded-full`}
                  >
                    {image.isMain ? 'Main' : 'Set Main'}
                  </button>
                </div>
              </div>
            ))}

            {/* New images to be uploaded */}
            {imageFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square relative border rounded overflow-hidden">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt="New product image"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="p-1 bg-red-500 text-white rounded-full"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Specifications section */}
        <div className="space-y-4 mt-8">
          <div className="flex justify-between items-center">
            <label className="text-lg font-medium">Specifications</label>
            <button 
              type="button"
              onClick={addSpec}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add Spec
            </button>
          </div>
          
          {specs.map((spec, index) => (
            <div key={index} className="p-4 border rounded space-y-3 bg-gray-50">
              <div className="flex justify-between">
                <h4 className="font-medium">Specification #{index + 1}</h4>
                <button 
                  type="button"
                  onClick={() => removeSpec(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-sm">Name</label>
                  <input
                    type="text"
                    value={spec.name}
                    onChange={(e) => updateSpec(index, 'name', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Clock Speed"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm">Value</label>
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => updateSpec(index, 'value', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., 3.4"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm">Unit (optional)</label>
                  <input
                    type="text"
                    value={spec.unit || ''}
                    onChange={(e) => updateSpec(index, 'unit', e.target.value || null)}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., GHz"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm">Group (optional)</label>
                  <input
                    type="text"
                    value={spec.groupName || ''}
                    onChange={(e) => updateSpec(index, 'groupName', e.target.value || null)}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Performance"
                  />
                </div>
              </div>

              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={spec.isHighlight || false}
                    onChange={(e) => updateSpec(index, 'isHighlight', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm">Highlight this specification</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-100 text-green-700 rounded">
            Product updated successfully!
          </div>
        )}

        <button type="submit" 
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Update Product
        </button>
      </form>
    </div>
  )
}