'use client'

import { useState } from 'react'
import { searchProducts } from './actions'
import AddProduct from './components/AddProduct'
import EditProduct from './components/EditProduct'

type Product = {
  id: string
  name: string
  sku: string
  description: string
  brand: string
  price: number // Changed from Decimal to number
  stock: number
  categoryId: string
  createdAt: string // Changed from Date to string
  updatedAt: string // Changed from Date to string
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

export default function AdminProducts() {
  const [view, setView] = useState<'add' | 'edit'>('edit')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

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
      } finally {
        setIsSearching(false)
      }
    } else {
      setSearchResults([])
    }
  }

  function handleSelectProduct(product: Product) {
    setSelectedProductId(product.id)
    setShowResults(false)
    setSearchQuery(product.name)  // Update search input with selected product name
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Management</h1>
        <div className="space-x-2">
          <button 
            onClick={() => {
              setView('add')
              setSelectedProductId(null)
              setSearchQuery('')
              setSearchResults([])
              setShowResults(false)
            }}
            className={`px-4 py-2 rounded ${
              view === 'add' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Add Product
          </button>
          <button 
            onClick={() => setView('edit')}
            className={`px-4 py-2 rounded ${
              view === 'edit' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Edit Product
          </button>
        </div>
      </div>

      {view === 'add' ? (
        <AddProduct />
      ) : (
        <div>
          <div className="relative mb-4">
            <input 
              type="text" 
              placeholder="Search products by name, SKU, or brand..."
              className="w-full p-2 border rounded"
              value={searchQuery}
              onChange={handleSearch}
              onFocus={() => setShowResults(true)}
            />

            {/* Dropdown for search results */}
            {showResults && (searchResults.length > 0 || isSearching) && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="text-gray-500 p-2">Searching...</div>
                ) : (
                  searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="w-full p-2 text-left hover:bg-gray-50 flex justify-between items-center border-b last:border-b-0"
                    >
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          SKU: {product.sku} • Brand: {product.brand}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₹{product.price}</div>
                        <div className="text-sm text-gray-500">{product.category.name}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedProductId && (
            <EditProduct productId={selectedProductId} />
          )}
        </div>
      )}
    </div>
  )
}