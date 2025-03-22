'use server'

import { revalidatePath } from 'next/cache'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type ComponentType = 'CPU' | 'GPU' | 'MOTHERBOARD' | 'RAM' | 'STORAGE' | 'PSU' | 'CASE' | 'COOLER' | 'OTHER'

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const stock = parseInt(formData.get('stock') as string)
  const brand = formData.get('brand') as string
  const sku = formData.get('sku') as string
  const componentType = formData.get('componentType') as ComponentType

  try {
    // First, get or create the category based on component type
    const category = await prisma.category.upsert({
      where: {
        name: componentType,
      },
      update: {},
      create: {
        name: componentType,
        slug: componentType.toLowerCase(),
      },
    })

    // Then create the product with the category
    await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        brand,
        sku,
        categoryId: category.id,
      },
    })
    
    revalidatePath('/admin/products')
  } catch (error) {
    console.error('Error creating product:', error)
    throw new Error('Failed to create product')
  }
}