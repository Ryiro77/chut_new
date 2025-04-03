'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addToCart } from '@/lib/api-client'
import { toast } from 'sonner'
import Image from 'next/image'

interface ApiError extends Error {
  message: string;
}

interface ProductDetailProps {
  product: {
    id: string
    name: string
    brand: string
    regularPrice: number
    discountedPrice?: number
    isOnSale: boolean
    images: Array<{
      id: string
      filePath: string
      isMain: boolean
    }>
    stock: number
  }
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(
    product.images.find(img => img.isMain)?.filePath || product.images[0]?.filePath
  )
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const handleQuantityChange = (value: number) => {
    // Still using stock internally for validation, but not showing it
    setQuantity(Math.max(1, Math.min(value, product.stock)))
  }

  const handleAddToCart = async () => {
    if (quantity < 1 || quantity > product.stock) return

    setIsAddingToCart(true)
    try {
      await addToCart([{
        id: product.id,
        name: product.name,
        brand: product.brand,
        regularPrice: product.regularPrice,
        discountedPrice: product.discountedPrice,
        isOnSale: product.isOnSale
      }], quantity)
      toast.success(`Added ${quantity} ${quantity === 1 ? 'unit' : 'units'} to cart`)
    } catch (error) {
      const apiError = error as ApiError
      toast.error(apiError.message || 'Failed to add to cart')
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Image Gallery */}
      <div className="space-y-4">
        <div className="relative aspect-square overflow-hidden rounded-lg border">
          <Image
            src={selectedImage ? `/uploads/${selectedImage}` : '/no-image.png'}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {product.images.map((image) => (
            <button
              key={image.id}
              className={`relative aspect-square overflow-hidden rounded-lg border ${
                selectedImage === image.filePath ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedImage(image.filePath)}
            >
              <Image
                src={`/uploads/${image.filePath}`}
                alt={product.name}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Stock Status */}
      <div className="text-sm">
        {product.stock > 0 ? (
          <span className="text-green-600 font-medium">In Stock</span>
        ) : (
          <span className="text-red-600 font-medium">Out of Stock</span>
        )}
      </div>

      {/* Quantity and Add to Cart */}
      {product.stock > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
            >
              -
            </Button>
            <Input
              type="number"
              min={1}
              max={product.stock}
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              className="w-20 text-center mx-2"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= product.stock}
            >
              +
            </Button>
          </div>
          <Button 
            size="lg" 
            className="flex-1"
            onClick={handleAddToCart}
            disabled={isAddingToCart}
          >
            {isAddingToCart ? 'Adding...' : 'Add to Cart'}
          </Button>
        </div>
      )}</div>
  )
}