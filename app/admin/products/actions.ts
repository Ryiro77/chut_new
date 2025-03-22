'use server'

import { revalidatePath } from 'next/cache'
import { PrismaClient, Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

type ComponentType = 'CPU' | 'GPU' | 'MOTHERBOARD' | 'RAM' | 'STORAGE' | 'PSU' | 'CASE' | 'COOLER' | 'OTHER'

type SpecInput = {
  id?: string
  name: string
  value: string
  unit?: string | null
  groupName?: string | null
  isHighlight?: boolean
  sortOrder?: number
}

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = new Decimal(formData.get('price') as string)
  const stock = parseInt(formData.get('stock') as string)
  const brand = formData.get('brand') as string
  const sku = formData.get('sku') as string
  const componentType = formData.get('componentType') as ComponentType
  const specs = JSON.parse(formData.get('specs') as string || '[]') as SpecInput[]

  try {
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

    await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        brand,
        sku,
        categoryId: category.id,
        specs: {
          create: specs.map(spec => ({
            name: spec.name,
            value: spec.value,
            unit: spec.unit,
            groupName: spec.groupName,
            isHighlight: spec.isHighlight || false,
            sortOrder: spec.sortOrder || 0
          }))
        }
      },
      include: {
        specs: true,
        category: true
      }
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
  const price = new Decimal(formData.get('price') as string)
  const stock = parseInt(formData.get('stock') as string)
  const brand = formData.get('brand') as string
  const sku = formData.get('sku') as string
  const componentType = formData.get('componentType') as ComponentType
  const specs = JSON.parse(formData.get('specs') as string || '[]') as SpecInput[]

  try {
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

    // First delete existing specs that are not in the new specs array
    const existingSpecIds = specs.filter(spec => spec.id).map(spec => spec.id as string)
    await prisma.productSpecification.deleteMany({
      where: { 
        productId: id,
        NOT: {
          id: {
            in: existingSpecIds
          }
        }
      }
    })

    // Then update the product with its specs
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
        specs: {
          upsert: specs.map(spec => ({
            where: {
              id: spec.id || '',
            },
            create: {
              name: spec.name,
              value: spec.value,
              unit: spec.unit,
              groupName: spec.groupName,
              isHighlight: spec.isHighlight || false,
              sortOrder: spec.sortOrder || 0
            },
            update: {
              name: spec.name,
              value: spec.value,
              unit: spec.unit,
              groupName: spec.groupName,
              isHighlight: spec.isHighlight || false,
              sortOrder: spec.sortOrder || 0
            }
          }))
        }
      }
    })
    
    revalidatePath('/admin/products')
  } catch (error) {
    console.error('Error updating product:', error)
    throw new Error('Failed to update product')
  }
}

// Define type for raw product from Prisma
type RawProduct = Prisma.ProductGetPayload<{
  include: { category: true; specs: true }
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
      include: { 
        category: true,
        specs: {
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
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
        category: true,
        specs: {
          orderBy: {
            sortOrder: 'asc'
          }
        }
      },
      take: 10
    })
    
    return products.map(serializeProduct)

  } catch (error) {
    console.error('Error searching products:', error)
    throw new Error('Failed to search products')
  }
}