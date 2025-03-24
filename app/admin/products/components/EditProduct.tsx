'use client'

import { useEffect, useState } from 'react'
import { getProduct, updateProduct, deleteProduct } from '../actions'
import Image from 'next/image'
import Tags from './Tags'

// const componentTypes = ['CPU', 'GPU', 'MOTHERBOARD', 'RAM', 'STORAGE', 'PSU', 'CASE', 'COOLER', 'OTHER'] as const

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
  }
  tags: { id: string; name: string }[]
}

const defaultCpuSpecs: Spec[] = [
  { name: 'Socket', value: '', sortOrder: 0, isHighlight: true },
  { name: 'Cores', value: '', sortOrder: 1, isHighlight: true },
  { name: 'Threads', value: '', sortOrder: 2, isHighlight: true },
  { name: 'Clock Speed', value: '', unit: 'GHz', sortOrder: 3, isHighlight: true },
  { name: 'Cache Size', value: '', unit: 'MB', sortOrder: 4, isHighlight: true }
]

export default function EditProduct({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [specs, setSpecs] = useState<Spec[]>([])
  const [success, setSuccess] = useState(false)
  const [images, setImages] = useState<ProductImage[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [mainImageId, setMainImageId] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await getProduct(productId)
        if (data) {
          setProduct(data as Product)
          
          // If it's a CPU and there are no specs, add the default CPU specs
          if (data.category.name === 'CPU' && (!data.specs || data.specs.length === 0)) {
            setSpecs(defaultCpuSpecs)
          } else {
            setSpecs(data.specs || [])
          }
          
          setImages(data.images || [])
          const mainImage = data.images?.find(img => img.isMain)
          setMainImageId(mainImage?.id || null)
          setTags(data.tags?.map(tag => tag.name) || [])
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

  const handleDelete = async () => {
    try {
      await deleteProduct(productId)
      window.location.href = '/admin/products' // Redirect after successful deletion
    } catch {
      setError('Failed to delete product')
      setTimeout(() => setError(null), 3000)
    }
  }

  async function handleSubmit(formData: FormData) {
    if (!product) return
    try {
      setSuccess(false)
      
      // Add specs to form data
      formData.append('specs', JSON.stringify(specs))
      
      // Add existing images with updated main image status
      formData.append('existingImages', JSON.stringify(images))
      
      // Add tags to form data
      formData.append('tags', JSON.stringify(tags))
      
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
    <div className="max-w-full">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Edit Product</h2>
          <span className="px-2 py-1 bg-gray-100 rounded text-sm">
            {product?.category.name.charAt(0) + product?.category.name.slice(1).toLowerCase().replace('_', ' ')}
          </span>
        </div>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          Delete Product
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Delete Product</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &ldquo;{product?.name}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-500 text-white hover:bg-red-600 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info and Images */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block mb-1 text-sm">Product Name</label>
                <input type="text" id="name" name="name" required 
                  defaultValue={product?.name}
                  className="w-full p-2 border rounded" />
              </div>

              <div>
                <label htmlFor="sku" className="block mb-1 text-sm">SKU</label>
                <input type="text" id="sku" name="sku" required 
                  defaultValue={product?.sku}
                  className="w-full p-2 border rounded" />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block mb-1 text-sm">Description</label>
              <textarea id="description" name="description" required 
                defaultValue={product?.description}
                className="w-full p-2 border rounded" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block mb-1 text-sm">Price</label>
                <input type="number" id="price" name="price" step="0.01" required 
                  defaultValue={product?.price}
                  className="w-full p-2 border rounded" />
              </div>

              <div>
                <label htmlFor="stock" className="block mb-1 text-sm">Stock</label>
                <input type="number" id="stock" name="stock" required 
                  defaultValue={product?.stock}
                  className="w-full p-2 border rounded" />
              </div>
            </div>

            <div>
              <label htmlFor="brand" className="block mb-1 text-sm">Brand</label>
              <input type="text" id="brand" name="brand" required 
                defaultValue={product?.brand}
                className="w-full p-2 border rounded" />
            </div>

            {/* Hidden component type input */}
            <input type="hidden" name="componentType" value={product?.category.name} />

            {/* Images Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Product Images</label>
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
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer"
                >
                  Add Images
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2">
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
                        ×
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetMainImage(image.id)}
                        className={`p-1 ${image.isMain ? 'bg-yellow-500' : 'bg-blue-500'} text-white rounded-full text-xs`}
                      >
                        {image.isMain ? 'Main' : 'Set'}
                      </button>
                    </div>
                  </div>
                ))}

                {/* New images */}
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
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Specs and Tags */}
          <div className="space-y-4 min-w-[400px]">
            {/* Specifications Section */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              <div className="flex justify-between items-center sticky top-0 bg-white py-2">
                <label className="text-sm font-medium">Specifications</label>
                <button 
                  type="button"
                  onClick={addSpec}
                  className="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Add Spec
                </button>
              </div>
              
              {specs.map((spec, index) => (
                <div key={index} className="p-3 border rounded space-y-2 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">{spec.name || `Spec #${index + 1}`}</h4>
                    <button 
                      type="button"
                      onClick={() => removeSpec(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ×
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        value={spec.name}
                        onChange={(e) => updateSpec(index, 'name', e.target.value)}
                        className="w-full p-1.5 border rounded text-sm"
                        placeholder="Name"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => updateSpec(index, 'value', e.target.value)}
                        className="w-full p-1.5 border rounded text-sm"
                        placeholder="Value"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        value={spec.unit || ''}
                        onChange={(e) => updateSpec(index, 'unit', e.target.value || null)}
                        className="w-full p-1.5 border rounded text-sm"
                        placeholder="Unit (optional)"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={spec.groupName || ''}
                        onChange={(e) => updateSpec(index, 'groupName', e.target.value || null)}
                        className="w-full p-1.5 border rounded text-sm"
                        placeholder="Group (optional)"
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
                      <span className="ml-2 text-xs">Highlight</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Tags Section */}
            <div className="mt-4">
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <Tags 
                selectedTags={tags} 
                onTagsChange={setTags} 
              />
              <input type="hidden" name="tags" value={JSON.stringify(tags)} />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-100 text-green-700 rounded text-sm">
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