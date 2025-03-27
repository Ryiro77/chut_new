'use client'

import { createProduct } from '../actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const componentTypes = ['CPU', 'GPU', 'MOTHERBOARD', 'RAM', 'STORAGE', 'PSU', 'CASE', 'COOLER', 'OTHER'] as const

export default function AddProduct() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    try {
      await createProduct(formData)
      toast.success('Product created successfully')
      router.push('/admin/products')
    } catch (error) {
      toast.error('Failed to create product', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" name="sku" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="regularPrice">Regular Price</Label>
              <Input 
                type="number" 
                id="regularPrice" 
                name="regularPrice" 
                step="0.01" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountedPrice">Discounted Price</Label>
              <Input 
                type="number" 
                id="discountedPrice" 
                name="discountedPrice" 
                step="0.01" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isOnSale"
                name="isOnSale"
              />
              <Label htmlFor="isOnSale">Item is on sale</Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input 
                type="number" 
                id="stock" 
                name="stock" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" name="brand" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="componentType">Component Type</Label>
            <Select name="componentType" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a component type" />
              </SelectTrigger>
              <SelectContent>
                {componentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')}
                  </SelectItem>
                ))}

              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Add Product'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}