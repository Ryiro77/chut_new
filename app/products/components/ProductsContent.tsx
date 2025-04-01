'use client'

import { useState, useEffect, useCallback } from "react"
import { Container } from "@/components/ui/container"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { getProducts } from "../actions"
import { Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { addToCart } from '@/lib/api-client'

interface Product {
  id: string;
  name: string;
  regularPrice: number;
  discountedPrice?: number;
  discountPercentage?: number;
  isOnSale: boolean;
  brand: string;
  description: string;
  price?: number;
  stock: number;
  sku: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  specs: Array<{
    id: string;
    name: string;
    value: string;
    unit?: string | null;
  }>;
  images: Array<{
    id: string;
    url: string | null;
    filePath: string;
    isMain: boolean;
  }>;
  tags: Array<{
    id: string;
    name: string;
  }>;
}

const componentTypes = ['ALL', 'CPU', 'GPU', 'MOTHERBOARD', 'RAM', 'STORAGE', 'PSU', 'CASE', 'COOLER'] as const
type ComponentType = (typeof componentTypes)[number]

type BaseFilter = {
  id: string
  label: string
}

type OptionsFilter = BaseFilter & {
  type?: never
  options: readonly string[]
}

type RangeFilter = BaseFilter & {
  type: 'range'
  min: number
  max: number
  unit: string
}

type FilterOption = OptionsFilter | RangeFilter

const filterOptions: Record<Exclude<ComponentType, 'ALL'>, readonly FilterOption[]> = {
  CPU: [
    { id: 'socket', label: 'Socket', options: ['AM4', 'AM5', 'LGA 1700', 'LGA 1200'] },
    { id: 'cores', label: 'Cores', options: ['4', '6', '8', '12', '16', '24', '32'] },
    { id: 'clockSpeed', label: 'Clock Speed', type: 'range', min: 2, max: 6, unit: 'GHz' }
  ],
  GPU: [
    { id: 'vram', label: 'VRAM', options: ['4GB', '6GB', '8GB', '12GB', '16GB', '24GB'] },
    { id: 'chipset', label: 'Chipset', options: ['NVIDIA', 'AMD'] },
  ],
  MOTHERBOARD: [
    { id: 'socket', label: 'Socket', options: ['AM4', 'AM5', 'LGA 1700', 'LGA 1200'] },
    { id: 'formFactor', label: 'Form Factor', options: ['ATX', 'Micro-ATX', 'Mini-ITX'] },
    { id: 'chipset', label: 'Chipset', options: ['B650', 'X670', 'B760', 'Z790'] }
  ],
  RAM: [
    { id: 'capacity', label: 'Capacity', options: ['8GB', '16GB', '32GB', '64GB'] },
    { id: 'type', label: 'Type', options: ['DDR4', 'DDR5'] },
    { id: 'speed', label: 'Speed', type: 'range', min: 3200, max: 7200, unit: 'MHz' }
  ],
  STORAGE: [
    { id: 'type', label: 'Type', options: ['NVMe', 'SATA SSD', 'HDD'] },
    { id: 'capacity', label: 'Capacity', options: ['256GB', '512GB', '1TB', '2TB', '4TB'] },
  ],
  PSU: [
    { id: 'wattage', label: 'Wattage', options: ['550W', '650W', '750W', '850W', '1000W', '1200W'] },
    { id: 'rating', label: 'Rating', options: ['80+ Bronze', '80+ Gold', '80+ Platinum'] },
    { id: 'modularity', label: 'Modularity', options: ['Full', 'Semi', 'Non-Modular'] }
  ],
  CASE: [
    { id: 'formFactor', label: 'Form Factor', options: ['Full Tower', 'Mid Tower', 'Mini Tower'] },
    { id: 'color', label: 'Color', options: ['Black', 'White', 'Gray'] }
  ],
  COOLER: [
    { id: 'type', label: 'Type', options: ['Air', 'AIO Liquid', 'Custom Loop'] },
    { id: 'size', label: 'Size', options: ['120mm', '240mm', '280mm', '360mm'] }
  ]
} as const

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(price)
}

export default function ProductsContent() {
  const [selectedType, setSelectedType] = useState<ComponentType>('ALL')
  const [priceRange, setPriceRange] = useState([0, 200000])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({})
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const categoryParam = searchParams.get('category')?.toUpperCase()
    if (categoryParam && componentTypes.includes(categoryParam as ComponentType)) {
      setSelectedType(categoryParam as ComponentType)
      setSelectedFilters({})
    }
  }, [searchParams])

  const currentFilters = selectedType !== 'ALL' ? filterOptions[selectedType as keyof typeof filterOptions] || [] : []

  const handleQuantityChange = (productId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: quantity
    }));
  };

  const handleAddToCart = async (product: Product) => {
    setAddingToCart(product.id)
    try {
      await addToCart([{
        id: product.id,
        name: product.name,
        brand: product.brand,
        regularPrice: product.regularPrice,
        discountedPrice: product.discountedPrice,
        isOnSale: product.isOnSale
      }], quantities[product.id] || 1)
      toast.success("Added to cart")
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast.error("Failed to add to cart")
    } finally {
      setAddingToCart(null)
    }
  }

  const handleAddToBuild = (product: Product) => {
    router.push(`/pc-builder?add=${product.id}&type=${product.category.name}`)
  }

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getProducts({
        category: selectedType === 'ALL' ? undefined : selectedType,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        search: searchQuery || undefined,
        filters: Object.keys(selectedFilters).length > 0 ? selectedFilters : undefined
      })
      setProducts(data as unknown as Product[])
    } catch (err) {
      setError('Failed to load products. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedType, priceRange, searchQuery, selectedFilters])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchProducts()
    }, 500)
    return () => clearTimeout(debounceTimer)
  }, [selectedType, priceRange, searchQuery, selectedFilters, fetchProducts])

  return (
    <main className="flex-1 py-8">
      <Container>
        <div className="flex flex-col space-y-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Component Type Selection */}
            <div className="w-full md:w-64 space-y-6">
              {/* <div>
                <h2 className="text-lg font-semibold mb-4">Component Type</h2>
                <div className="space-y-2">
                  {componentTypes.map(type => (
                    <Button
                      key={type}
                      variant={selectedType === type ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedType(type)
                        setSelectedFilters({})
                      }}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div> */}

              <div>
                <h2 className="text-lg font-semibold mb-4">Filters</h2>
                <div className="space-y-4">
                  {/* Dynamic Filters */}
                  {currentFilters.map(filter => (
                    <div key={filter.id}>
                      <h3 className="text-sm font-medium mb-2">{filter.label}</h3>
                      {'type' in filter && filter.type === 'range' ? (
                        <div className="space-y-4">
                          <Slider
                            min={filter.min}
                            max={filter.max}
                            step={(filter.max - filter.min) / 20}
                            value={[
                              selectedFilters[filter.id]?.[0] ? parseInt(selectedFilters[filter.id][0]) : filter.min,
                              selectedFilters[filter.id]?.[1] ? parseInt(selectedFilters[filter.id][1]) : filter.max
                            ]}
                            onValueChange={(value) => {
                              setSelectedFilters(prev => ({
                                ...prev,
                                [filter.id]: value.map(String)
                              }))
                            }}
                          />
                          <div className="flex items-center justify-between text-sm">
                            <span>{selectedFilters[filter.id]?.[0] || filter.min}{filter.unit}</span>
                            <span>{selectedFilters[filter.id]?.[1] || filter.max}{filter.unit}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filter.options.map(option => (
                            <div key={option} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${filter.id}-${option}`}
                                checked={selectedFilters[filter.id]?.includes(option) || false}
                                onCheckedChange={(checked) => {
                                  setSelectedFilters(prev => {
                                    const current = prev[filter.id] || []
                                    return {
                                      ...prev,
                                      [filter.id]: checked 
                                        ? [...current, option]
                                        : current.filter(item => item !== option)
                                    }
                                  })
                                }}
                              />
                              <label
                                htmlFor={`${filter.id}-${option}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {option}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Price Range Filter */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Price Range</h3>
                    <div className="space-y-4">
                      <Slider
                        min={0}
                        max={200000}
                        step={1000}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="mt-2"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span>₹{formatPrice(priceRange[0])}</span>
                        <span>₹{formatPrice(priceRange[1])}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Search */}
              <div className="mb-6">
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>

              {error && (
                <div className="p-4 mb-6 bg-red-50 text-red-500 rounded-md">
                  {error}
                </div>
              )}

              {/* Products Grid */}
              {loading ? (
                <div className="flex items-center justify-center min-h-[200px]">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No products found matching your criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map(product => (
                    <Card key={product.id} className="overflow-hidden group">
                      <div className="aspect-square relative bg-muted">
                        {product.images?.length > 0 && (
                          <Image
                            src={
                              product.images.find(img => img.isMain)?.url || 
                              `/uploads/${product.images.find(img => img.isMain)?.filePath || 
                              product.images[0]?.filePath}` ||
                              '/no-image.png'
                            }
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-contain"
                            priority={product.images.find(img => img.isMain)?.isMain}
                          />
                        )}
                      </div>
                      <CardHeader>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{product.brand}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="mt-4 space-y-1">
                          {product.specs?.filter(spec => spec.name.toLowerCase() !== 'type')
                            .slice(0, 3)
                            .map(spec => (
                              <div key={spec.id} className="text-sm">
                                <span className="text-muted-foreground">{spec.name}: </span>
                                <span>{spec.value}{spec.unit ? ` ${spec.unit}` : ''}</span>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col gap-4">
                        <div className="w-full">
                          {product.isOnSale && product.discountedPrice ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold">₹{formatPrice(product.discountedPrice)}</span>
                                <span className="text-sm text-muted-foreground line-through">₹{formatPrice(product.regularPrice)}</span>
                              </div>
                              <div className="text-sm text-green-600 font-medium">
                                {Math.round(((product.regularPrice - product.discountedPrice) / product.regularPrice) * 100)}% off
                              </div>
                            </>
                          ) : (
                            <span className="text-lg font-semibold">₹{formatPrice(product.regularPrice)}</span>
                          )}
                        </div>
                        <div className="w-full grid grid-cols-2 gap-2">
                          {product.category.name !== 'OTHER' && (
                            <>
                              <div className="col-span-2 flex items-center justify-end gap-2 mb-2">
                                <label className="text-sm">Quantity:</label>
                                <select 
                                  className="w-20 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                                  onChange={(e) => {
                                    const qty = parseInt(e.target.value);
                                    handleQuantityChange(product.id, qty);
                                  }}
                                  defaultValue="1"
                                >
                                  {[...Array(8)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                      {i + 1}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <Button 
                                variant="outline"
                                onClick={() => handleAddToBuild(product)}
                                className="w-full text-sm px-2"
                              >
                                Add to Build
                              </Button>
                              <Button
                                onClick={() => handleAddToCart(product)}
                                disabled={addingToCart === product.id}
                                className="w-full text-sm px-2"
                              >
                                {addingToCart === product.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Add to Cart
                              </Button>
                            </>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </main>
  )
}