'use server'

import { revalidatePath } from 'next/cache'
import { PrismaClient, Prisma } from '@prisma/client'

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

export async function updateProduct(id: string, formData: FormData) {
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

    // Then update the product
    await prisma.product.update({
      where: { id },
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
    console.error('Error updating product:', error)
    throw new Error('Failed to update product')
  }
}

// Define type for raw product from Prisma
type RawProduct = Prisma.ProductGetPayload<{
  include: { category: true }
}>

// Transform Prisma data to be serializable
function serializeProduct(product: RawProduct) {
  return {
    ...product,
    price: product.price.toNumber(),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  }
}

export async function getProduct(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true }
    })
    
    if (!product) return null
    return serializeProduct(product)

  } catch (error) {
    console.error('Error fetching product:', error)
    throw new Error('Failed to fetch product')
  }
}

export async function searchProducts(query: string) {
  const searchQuery = query.toLowerCase()
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery } },
          { sku: { contains: searchQuery } },
          { brand: { contains: searchQuery } },
        ],
      },
      include: {
        category: true
      },
      take: 10
    })
    
    // Transform each product to be serializable
    return products.map(serializeProduct)

  } catch (error) {
    console.error('Error searching products:', error)
    throw new Error('Failed to search products')
  }
}