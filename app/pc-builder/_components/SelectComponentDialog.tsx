'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Product } from "@/lib/types"
import { useEffect, useState } from "react"
import { getProducts } from "../actions"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface SelectComponentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  componentType?: string
  onSelect?: (product: Product) => void
}

export function SelectComponentDialog({
  open,
  onOpenChange,
  componentType,
  onSelect
}: SelectComponentDialogProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (open && componentType) {
      const fetchProducts = async () => {
        setLoading(true)
        try {
          const data = await getProducts({
            category: componentType,
            search: search || undefined
          })
          setProducts(data)
        } catch (error) {
          console.error('Failed to fetch products:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchProducts()
    }
  }, [open, componentType, search])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select {componentType?.toLowerCase()}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <Card key={product.id} className="cursor-pointer hover:bg-accent" onClick={() => {
                    onSelect?.(product)
                    onOpenChange(false)
                  }}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20">
                          <Image
                            src={product.images?.find(img => img.isMain)?.url ||
                                `/uploads/${product.images?.find(img => img.isMain)?.filePath ||
                                product.images?.[0]?.filePath}` ||
                                '/no-image.png'
                            }
                            alt={product.name}
                            fill
                            className="object-contain rounded-md"
                            sizes="80px"
                            priority
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">{product.brand}</p>
                          {product.isOnSale && product.discountedPrice ? (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">₹{product.discountedPrice.toLocaleString()}</span>
                              <span className="text-sm text-muted-foreground line-through">
                                ₹{product.regularPrice.toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="font-medium">₹{product.regularPrice.toLocaleString()}</span>
                          )}
                        </div>
                        <Button>Select</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}