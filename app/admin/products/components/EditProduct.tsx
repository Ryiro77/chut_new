'use client'

import { useEffect, useState } from 'react'
import { getProduct, updateProduct, deleteProduct } from '../actions'
import Image from 'next/image'
import Tags from './Tags'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"

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

const defaultGpuSpecs: Spec[] = [
  { name: 'Chipset', value: '', sortOrder: 0, isHighlight: true },
  { name: 'VRAM', value: '', unit: 'GB', sortOrder: 1, isHighlight: true },
  { name: 'Clock Speed', value: '', unit: 'MHz', sortOrder: 2, isHighlight: true },
  { name: 'Interface', value: '', sortOrder: 3, isHighlight: true }
]

const defaultMotherboardSpecs: Spec[] = [
  { name: 'Socket Compatibility', value: '', sortOrder: 0, isHighlight: true },
  { name: 'Chipset', value: '', sortOrder: 1, isHighlight: true },
  { name: 'RAM Slots', value: '', sortOrder: 2, isHighlight: true },
  { name: 'PCIe Slots', value: '', sortOrder: 3, isHighlight: true },
  { name: 'M.2 Slots', value: '', sortOrder: 4, isHighlight: true },
  { name: 'Form Factor', value: '', sortOrder: 5, isHighlight: true }
]

const defaultRamSpecs: Spec[] = [
  { name: 'Capacity', value: '', unit: 'GB', sortOrder: 0, isHighlight: true },
  { name: 'Speed', value: '', unit: 'MHz', sortOrder: 1, isHighlight: true },
  { name: 'Type', value: '', sortOrder: 2, isHighlight: true },
  { name: 'Latency', value: 'CL', sortOrder: 3, isHighlight: true }
]

const defaultStorageSpecs: Spec[] = [
  { name: 'Type', value: '', sortOrder: 0, isHighlight: true },
  { name: 'Capacity', value: '', unit: 'GB', sortOrder: 1, isHighlight: true },
  { name: 'Interface', value: '', sortOrder: 2, isHighlight: true },
  { name: 'Speed', value: '', unit: 'MB/s', sortOrder: 3, isHighlight: true }
]

const defaultCoolerSpecs: Spec[] = [
  { name: 'Type', value: '', sortOrder: 0, isHighlight: true },
  { name: 'Socket Compatibility', value: '', sortOrder: 1, isHighlight: true },
  { name: 'TDP', value: '', unit: 'W', sortOrder: 2, isHighlight: true },
  { name: 'Noise Level', value: '', unit: 'dBA', sortOrder: 3, isHighlight: true }
]

const defaultCaseSpecs: Spec[] = [
  { name: 'Form Factor', value: '', sortOrder: 0, isHighlight: true },
  { name: 'Airflow', value: '', sortOrder: 1, isHighlight: true },
  { name: 'Expansion Slots', value: '', sortOrder: 2, isHighlight: true }
]

const defaultPsuSpecs: Spec[] = [
  { name: 'Wattage', value: '', unit: 'W', sortOrder: 0, isHighlight: true },
  { name: 'Efficiency Rating', value: '', sortOrder: 1, isHighlight: true },
  { name: 'Modularity', value: '', sortOrder: 2, isHighlight: true },
  { name: 'Connectors', value: '', sortOrder: 3, isHighlight: true }
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
          
          // If the product has no specs, add default specs based on category
          if (!data.specs || data.specs.length === 0) {
            switch (data.category.name) {
              case 'CPU':
                setSpecs(defaultCpuSpecs)
                break
              case 'GPU':
                setSpecs(defaultGpuSpecs)
                break
              case 'MOTHERBOARD':
                setSpecs(defaultMotherboardSpecs)
                break
              case 'RAM':
                setSpecs(defaultRamSpecs)
                break
              case 'STORAGE':
                setSpecs(defaultStorageSpecs)
                break
              case 'COOLER':
                setSpecs(defaultCoolerSpecs)
                break
              case 'CASE':
                setSpecs(defaultCaseSpecs)
                break
              case 'PSU':
                setSpecs(defaultPsuSpecs)
                break
              default:
                setSpecs([])
            }
          } else {
            setSpecs(data.specs)
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
  if (error) return <div className="text-destructive">{error}</div>

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Edit Product</h2>
          <Badge variant="secondary">
            {product?.category.name.charAt(0) + product?.category.name.slice(1).toLowerCase().replace('_', ' ')}
          </Badge>
        </div>
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
          Delete Product
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{product?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <form action={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info and Images */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" required defaultValue={product?.name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" required defaultValue={product?.sku} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                required 
                defaultValue={product?.description}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input 
                  type="number" 
                  id="price" 
                  name="price" 
                  step="0.01" 
                  required 
                  defaultValue={product?.price}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input 
                  type="number" 
                  id="stock" 
                  name="stock" 
                  required 
                  defaultValue={product?.stock}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" name="brand" required defaultValue={product?.brand} />
            </div>

            {/* Hidden component type input */}
            <input type="hidden" name="componentType" value={product?.category.name} />

            {/* Images Section */}
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex justify-between items-center">
                  <Label>Product Images</Label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="imageUpload"
                  />
                  <Button variant="secondary" asChild>
                    <label htmlFor="imageUpload" className="cursor-pointer">
                      Add Images
                    </label>
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Existing images */}
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square relative border rounded-md overflow-hidden">
                        <Image
                          src={image.url || image.filePath}
                          alt="Product"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveExistingImage(image.id)}
                        >
                          Remove
                        </Button>
                        <Button
                          type="button"
                          variant={image.isMain ? "default" : "secondary"}
                          size="sm"
                          onClick={() => handleSetMainImage(image.id)}
                        >
                          {image.isMain ? 'Main' : 'Set Main'}
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* New images */}
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square relative border rounded-md overflow-hidden">
                        <Image
                          src={URL.createObjectURL(file)}
                          alt="New product image"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveImage(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Specs and Tags */}
          <div className="space-y-4 min-w-[400px]">
            {/* Specifications Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <Label>Specifications</Label>
                  <Button 
                    type="button"
                    onClick={addSpec}
                    variant="secondary"
                    size="sm"
                  >
                    Add Spec
                  </Button>
                </div>
                
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-4">
                    {specs.map((spec, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex justify-between items-center">
                            <Label>{spec.name || `Spec #${index + 1}`}</Label>
                            <Button 
                              type="button"
                              onClick={() => removeSpec(index)}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              Remove
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Input
                                value={spec.name}
                                onChange={(e) => updateSpec(index, 'name', e.target.value)}
                                placeholder="Name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Input
                                value={spec.value}
                                onChange={(e) => updateSpec(index, 'value', e.target.value)}
                                placeholder="Value"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Input
                                value={spec.unit || ''}
                                onChange={(e) => updateSpec(index, 'unit', e.target.value || null)}
                                placeholder="Unit (optional)"
                              />
                            </div>
                            <div className="space-y-2">
                              <Input
                                value={spec.groupName || ''}
                                onChange={(e) => updateSpec(index, 'groupName', e.target.value || null)}
                                placeholder="Group (optional)"
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`highlight-${index}`}
                              checked={spec.isHighlight || false}
                              onCheckedChange={(checked) => 
                                updateSpec(index, 'isHighlight', checked)
                              }
                            />
                            <Label htmlFor={`highlight-${index}`} className="text-sm">
                              Highlight this specification
                            </Label>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Tags Section */}
            <Card>
              <CardContent className="pt-6">
                <Label className="mb-2 block">Tags</Label>
                <Tags 
                  selectedTags={tags} 
                  onTagsChange={setTags} 
                />
                <input type="hidden" name="tags" value={JSON.stringify(tags)} />
              </CardContent>
            </Card>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 text-green-700 rounded-md text-sm">
            Product updated successfully!
          </div>
        )}

        <Button type="submit" className="w-full">
          Update Product
        </Button>
      </form>
    </div>
  )
}