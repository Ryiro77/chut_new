'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { searchProducts } from '@/app/products/actions'

type Product = {
  id: string
  name: string
  brand: string
  sku: string
  regularPrice: number
  discountedPrice: number | null
  isOnSale: boolean
  category: {
    name: string
  }
  images: Array<{
    id: string
    url: string | null
    filePath: string
    isMain: boolean
  }>
}

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const router = useRouter()

  async function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value
    setSearchQuery(query)
    setShowResults(true)
    
    if (query.length >= 2) {
      setIsSearching(true)
      try {
        const results = await searchProducts(query)
        setSearchResults(results)
      } catch (error) {
        console.error('Search failed:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    } else {
      setSearchResults([])
    }
  }

  function handleSelectProduct(product: Product) {
    setShowResults(false)
    setSearchQuery('')
    router.push(`/products/${product.id}`)
  }

  return (
    <div className="relative w-full max-w-[600px]">
      <Input 
        type="text" 
        placeholder="Search products by name, SKU, or brand..."
        value={searchQuery}
        onChange={handleSearch}
        onFocus={() => setShowResults(true)}
        className="w-full"
      />

      {showResults && (searchResults.length > 0 || isSearching) && (
        <Card className="absolute z-50 w-full mt-1">
          <ScrollArea className="max-h-[400px]">
            {isSearching ? (
              <div className="p-3 text-muted-foreground">Searching...</div>
            ) : (
              <div className="divide-y">
                {searchResults.map((product) => (
                  <Button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    variant="ghost"
                    className="w-full justify-between h-auto py-3 px-4"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                        <Image
                          src={product.images?.[0]?.filePath 
                            ? `/uploads/${product.images[0].filePath}` 
                            : '/no-image.png'}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          SKU: {product.sku} • Brand: {product.brand}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          ₹{product.isOnSale && product.discountedPrice 
                            ? product.discountedPrice 
                            : product.regularPrice}
                        </div>
                        <div className="text-sm text-muted-foreground">{product.category.name}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      )}
    </div>
  )
}