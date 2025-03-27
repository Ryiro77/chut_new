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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


type Spec = {
  id?: string
  name: string
  value: string
  unit?: string | null
  groupName?: string | null
  isHighlight?: boolean
  sortOrder?: number
}

interface ProductImage {
  id: string;
  url: string | null;
  filePath: string;
  isMain: boolean;
}

interface ProductTag {
  id: string;
  name: string;
}

interface ProductData {
  id: string;
  name: string;
  sku: string;
  description: string;
  regularPrice: number;
  discountedPrice?: number;
  isOnSale: boolean;
  stock: number;
  brand: string;
  category: {
    name: string;
  };
  specs?: Spec[];
  images?: ProductImage[];
  tags?: ProductTag[];
}

const defaultCpuSpecs: Spec[] = [
  { name: 'Socket', value: '', sortOrder: 0, isHighlight: true },
  { name: 'Cores', value: '', sortOrder: 1, isHighlight: true },
  { name: 'Threads', value: '', sortOrder: 2, isHighlight: true },
  { name: 'CPU Clock Speed', value: '', unit: 'GHz', sortOrder: 3, isHighlight: true },
  { name: 'CPU Boost Clock Speed', value: '', unit: 'GHz', sortOrder: 4, isHighlight: true },
  { name: 'Cache Size', value: '', unit: 'MB', sortOrder: 5, isHighlight: true }
]

const defaultGpuSpecs: Spec[] = [
  { name: 'PCIe Generation', value: '', sortOrder: 0, isHighlight: true },
  { name: 'GPU Chipset', value: '', sortOrder: 1, isHighlight: true },
  { name: 'VRAM', value: '', unit: 'GB', sortOrder: 2, isHighlight: true },
  { name: 'GPU Clock Speed', value: '', unit: 'MHz', sortOrder: 3, isHighlight: true }

]

const defaultMotherboardSpecs: Spec[] = [
  { name: 'Socket', value: '', sortOrder: 0, isHighlight: true },
  { name: 'Chipset', value: '', sortOrder: 1, isHighlight: true },
  { name: 'RAM Type', value: '', sortOrder: 2, isHighlight: true },
  { name: 'RAM Slots', value: '', sortOrder: 3, isHighlight: true },
  { name: 'PCIe Generation', value: '', sortOrder: 4, isHighlight: true },
  { name: 'PCIe Slots', value: '', sortOrder: 5, isHighlight: true },
  { name: 'SATA Ports', value: '', sortOrder: 6, isHighlight: true },
  { name: 'M.2 Slots', value: '', sortOrder: 7, isHighlight: true },
  { name: 'Form Factor', value: '', sortOrder: 8, isHighlight: true }
]

const defaultRamSpecs: Spec[] = [
  { name: 'RAM Type', value: '', sortOrder: 0, isHighlight: true },
  { name: 'Capacity', value: '', unit: 'GB', sortOrder: 1, isHighlight: true },
  { name: 'Speed', value: '', unit: 'MHz', sortOrder: 2, isHighlight: true },
  { name: 'Latency', value: 'CL', sortOrder: 3, isHighlight: true }
]

const defaultStorageSpecs: Spec[] = [
  { name: 'Storage Type', value: '', sortOrder: 0, isHighlight: true },
  { name: 'Storage Capacity', value: '', unit: '', sortOrder: 1, isHighlight: true },
  { name: 'Storage Interface', value: '', sortOrder: 2, isHighlight: true },
  { name: 'Speed', value: '', unit: 'MB/s', sortOrder: 3, isHighlight: true }
]

const defaultCoolerSpecs: Spec[] = [
  { name: 'Cooler Type', value: '', sortOrder: 0, isHighlight: true },
  { name: 'Cooler Socket', value: '', sortOrder: 1, isHighlight: true },
  { name: 'TDP', value: '', unit: 'W', sortOrder: 2, isHighlight: true },
  { name: 'Noise Level', value: '', unit: 'dBA', sortOrder: 3, isHighlight: true }
]

const defaultCaseSpecs: Spec[] = [
  { name: 'Case Form Factor', value: '', sortOrder: 0, isHighlight: true },
  { name: 'Airflow', value: '', sortOrder: 1, isHighlight: true },
  { name: 'Expansion Slots', value: '', sortOrder: 2, isHighlight: true }
]

const defaultPsuSpecs: Spec[] = [
  { name: 'PSU Wattage', value: '', unit: 'W', sortOrder: 0, isHighlight: true },
  { name: 'Efficiency Rating', value: '', sortOrder: 1, isHighlight: true },
  {name: 'PSU Form Factor', value: '', sortOrder: 2, isHighlight: true },
  { name: 'Modularity', value: '', sortOrder: 3, isHighlight: true },
  { name: 'SATA Connectors', value: '', sortOrder: 4, isHighlight: true },
  { name: 'PCIe Connectors', value: '', sortOrder: 5, isHighlight: true },
  { name: 'CPU Connectors', value: '', sortOrder: 6, isHighlight: true },
  {name: 'has_6_pin_Connectors', value: '', sortOrder: 7, isHighlight: true },
  { name: 'has_8_pin_Connectors', value: '', sortOrder: 8, isHighlight: true },
  { name: 'has_12VHPWR_Connectors', value: '', sortOrder: 9, isHighlight: true },
]

const CPU_Connectors = [
  "4-pin ATX12V",  
  "8-pin EPS12V",
  "Dual 8-pin EPS12V"
];

// Single source of truth for connector options
const Has_6_pin_Connectors = ['Yes', 'No'];

const has_8_pin_Connectors = [
  "true", "false"
];
const has_12VHPWR_Connectors = [
  "true", "false"
];

const Case_Form_Factor = [
  'ATX',
  'Micro ATX',
  'Mini ITX',
  'E-ATX',
  'XL-ATX',
  'SSI CEB',
  'WTX',
  'NLX',
  'LPX',
  'Mini-DTX',
  'Nano-ITX',
  'Pico-ITX',
  'Mobile-ITX'
]



const PSU_Efficiency_Ratings = [
  '80 PLUS',
  '80 PLUS Bronze',
  '80 PLUS Silver',
  '80 PLUS Gold',
  '80 PLUS Platinum',
  '80 PLUS Titanium',
  '80 PLUS White',
  '80 PLUS Black',
];
const PSU_Form_Factor = [
  'ATX',
  'SFX', 'SFX-L', 'TFX', 'Flex ATX', 'Micro ATX', 'Mini ITX', 'PS2', 'PS3'];

// Define motherboard socket options (can be the same or different)
const socketOptions = [
  'LGA1151',
  'LGA1200',
  'LGA1700',
  'LGA1851',
  'LGA2066',
  'AM5',
  'AM4',
  'TR4',
  'sTRX4'
];
const Storage_Type = [
  'HDD',
  'SSD',
];
const Storage_Interface = [
  'SATA',
  'M.2',
];


const SATA_Ports = [
  '8','7','6','5','4','3','2','1','0'
];

const M2_Slots = [
  '4','3','2','1','0'
];

const RAM_Type = [
  'DDR4',
  'DDR5',
  'LPDDR4',
  'LPDDR5',
  'DDR3',
  'DDR6',
  'DDR7',
]

const PCIe_generation = [
  'PCIe 3.0',
  'PCIe 4.0',
  'PCIe 5.0',
  'PCIe 6.0'
]

// Define motherboard socket options (can be the same or different)
const chipsetOptions = [
   "Intel Z790",
    "Intel H770",
    "Intel B760",
    "Intel Z690",
    "Intel H670",
    "Intel B660",
    "Intel B860",
    "Intel H610",
    "Intel W-series (various)",
    "AMD X670E",
    "AMD X670",
    "AMD B650E",
    "AMD B650",
    "AMD A620",
    "AMD X570",
    "AMD B550",
    "AMD A520"
];

const motherboard_form_factors = [
  "ATX",
  "Micro-ATX (mATX)",
  "Mini-ITX",
  "Extended ATX (E-ATX)",
  "XL-ATX",
  "SSI CEB",
  "WTX",
  "NLX",
  "LPX",
  "Mini-DTX",
  "Nano-ITX",
  "Pico-ITX",
  "Mobile-ITX"
];

const gpu_chipsets = [
  "NVIDIA GeForce RTX 50 Series",
  "NVIDIA GeForce RTX 40 Series",
  "NVIDIA GeForce RTX 30 Series",
  "AMD Radeon RX 7000 Series",
  "AMD Radeon RX 6000 Series",
  "Intel Battlemage Series",
  "Intel Celestial Series",
  "Intel Arc Series",
  "Intel Integrated Graphics",
  "AMD Radeon Integrated Graphics",
  "NVIDIA RTX Ada Generation (Professional)",
  "AMD Radeon Pro Series (Professional)",
  "NVIDIA Data Center GPUs (H100, A100, etc.)",
  "AMD Data Center GPUs (Instinct Series)",
  "Qualcomm Adreno Series (Mobile)",
  "Apple Silicon GPUs (Mobile)",
  "ARM Mali Series (Mobile)"
];

const Cooler_Type = [
  'Air Cooler',
  'AIO Liquid Cooler',
  'Custom Loop',
  'Low Profile Air Cooler',
  'Passive Cooler'
];

export default function EditProduct({ productId }: { productId: string }) {
  const [product, setProduct] = useState<ProductData | null>(null)
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
          setProduct(data as ProductData)
          
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
          const mainImage = data.images?.find((img: ProductImage) => img.isMain)
          setMainImageId(mainImage?.id || null)
          setTags(data.tags?.map((tag: ProductTag) => tag.name) || [])
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="regularPrice">Regular Price</Label>
                <Input 
                  type="number" 
                  id="regularPrice" 
                  name="regularPrice" 
                  step="0.01" 
                  required 
                  defaultValue={product?.regularPrice}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountedPrice">Discounted Price</Label>
                <Input 
                  type="number" 
                  id="discountedPrice" 
                  name="discountedPrice" 
                  step="0.01" 
                  defaultValue={product?.discountedPrice}
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isOnSale"
                  name="isOnSale"
                  defaultChecked={product?.isOnSale}
                />
                <Label htmlFor="isOnSale">Item is on sale</Label>
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
                          src={image.url ? image.url : `/uploads/products/${image.filePath.split('/').pop()}`}
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
                    {specs.map((spec, index) => {
                      return (
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
                                {/* --- TEMPORARY TEST: Always render Select for 'Socket' spec --- */}
                                {spec.name === 'Socket' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Socket" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {socketOptions.map((socket: string) => (
                                        <SelectItem key={socket} value={socket}>
                                          {socket}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )
                                /* Default Input for other specs */
                                : product?.category.name === 'COOLER' && spec.name === 'Cooler Type' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Cooler Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Cooler_Type.map((type: string) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'Chipset' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={'Select Chipset'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {chipsetOptions.map(chipset => (
                                        <SelectItem key={chipset} value={chipset}>
                                          {chipset}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'Form Factor' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={'Select Form Factor'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {motherboard_form_factors.map(formFactor => (
                                        <SelectItem key={formFactor} value={formFactor}>
                                          {formFactor}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'GPU Chipset' ? ( 
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={'Select GPU Chipset'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {gpu_chipsets.map(gpuChipset => (
                                        <SelectItem key={gpuChipset} value={gpuChipset}>
                                          {gpuChipset}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'PCIe Generation' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={'Select PCIe Generation'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PCIe_generation.map(generation => (
                                        <SelectItem key={generation} value={generation}>
                                          {generation}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'RAM Type' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={'Select RAM Type'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {RAM_Type.map(type => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'SATA Ports' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={'Select SATA Ports'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {SATA_Ports.map(port => (
                                        <SelectItem key={port} value={port}>
                                          {port}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'M.2 Slots' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={'Select M.2 Slots'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {M2_Slots.map(slot => (
                                        <SelectItem key={slot} value={slot}>
                                          {slot}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'M.2 Slots' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={'Select M.2 Slots'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {M2_Slots.map(slot => (
                                        <SelectItem key={slot} value={slot}>
                                          {slot}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'Storage Type' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={'Select Storage Type'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Storage_Type.map(type => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'Storage Interface' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={'Select Storage Interface'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Storage_Interface.map(interfaceType => (
                                        <SelectItem key={interfaceType} value={interfaceType}>
                                          {interfaceType}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'Storage Interface' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={'Select Storage Interface'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Storage_Interface.map(interfaceType => (
                                        <SelectItem key={interfaceType} value={interfaceType}>
                                          {interfaceType}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'Efficiency Rating' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={'Select Efficiency Rating'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PSU_Efficiency_Ratings.map(rating => (
                                        <SelectItem key={rating} value={rating}>
                                          {rating}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'PSU Form Factor' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={'Select PSU Form Factor'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PSU_Form_Factor.map(formFactor => (
                                        <SelectItem key={formFactor} value={formFactor}>
                                          {formFactor}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'CPU Connectors' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={'Select CPU Connectors'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {CPU_Connectors.map(connector => (
                                        <SelectItem key={connector} value={connector}>
                                          {connector}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'has_6_pin_Connectors' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select 6-pin Connector Option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Has_6_pin_Connectors.map((option: string) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'has_8_pin Connectors' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={'Select 8-pin Connectors'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {has_8_pin_Connectors.map(connector => (
                                        <SelectItem key={connector} value={connector}>
                                          {connector}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'has_12VHPWR Connectors' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={'Select 12VHPWR Connectors'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {has_12VHPWR_Connectors.map(connector => (
                                        <SelectItem key={connector} value={connector}>
                                          {connector}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : spec.name === 'Case Form Factor' ? (
                                  <Select
                                    value={spec.value}
                                    onValueChange={(value) => updateSpec(index, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={'Select Case Form Factor'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Case_Form_Factor.map(formFactor => (
                                        <SelectItem key={formFactor} value={formFactor}>
                                          {formFactor}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>):
                                 (
                                  <Input
                                    value={spec.value}
                                    onChange={(e) => updateSpec(index, 'value', e.target.value)}
                                    placeholder="Value"
                                  />
                                )}
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
                      );
                    })}
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