'use server'

import { revalidatePath } from 'next/cache'
import { PrismaClient, Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs/promises'

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

async function handleImageUpload(file: File): Promise<{ filePath: string; size: number; mimeType: string }> {
  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Create unique filename
    const uniqueFilename = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    const relativePath = `/uploads/products/${uniqueFilename}`
    const absolutePath = join(process.cwd(), 'public', relativePath)
    
    // Ensure directory exists
    await createUploadDirIfNotExists()
    
    // Write file
    await writeFile(absolutePath, buffer)
    
    return {
      filePath: relativePath,
      size: file.size,
      mimeType: file.type
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    throw new Error('Failed to upload image')
  }
}

async function createUploadDirIfNotExists() {
  const dir = join(process.cwd(), 'public', 'uploads', 'products')
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch (error) {
    console.error('Error creating upload directory:', error)
    throw new Error('Failed to create upload directory')
  }
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
  const tags = JSON.parse(formData.get('tags') as string || '[]') as string[]

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
        },
        tags: {
          create: tags.map(name => ({
            name: name.toLowerCase()
          }))
        }
      },
      include: {
        specs: true,
        category: true,
        tags: true
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
  const existingImages = JSON.parse(formData.get('existingImages') as string || '[]') as ProductImage[]
  const tags = JSON.parse(formData.get('tags') as string || '[]') as string[]
  const existingImageIds = existingImages.map((img) => img.id)

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

    // Handle existing specs deletion
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

    // Handle images deletion
    await prisma.productImage.deleteMany({
      where: {
        productId: id,
        NOT: {
          id: {
            in: existingImageIds
          }
        }
      }
    })

    // Update existing images (main status)
    for (const image of existingImages) {
      await prisma.productImage.update({
        where: { id: image.id },
        data: { isMain: image.isMain }
      })
    }

    // Handle new image uploads
    const newImages = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image') && value instanceof File) {
        const imageData = await handleImageUpload(value)
        newImages.push(imageData)
      }
    }

    // Find or create tags first
    const tagConnections = await Promise.all(
      tags.map(async (tagName) => {
        const normalizedName = tagName.toLowerCase()
        const existingTag = await prisma.productTag.findUnique({
          where: { name: normalizedName }
        })
        
        if (existingTag) {
          return { id: existingTag.id }
        }
        
        const newTag = await prisma.productTag.create({
          data: { name: normalizedName }
        })
        return { id: newTag.id }
      })
    )

    // Update product with all changes
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
        },
        images: {
          create: newImages.map(img => ({
            ...img,
            isMain: false
          }))
        },
        tags: {
          set: tagConnections
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
  include: { category: true; specs: true; images: true; tags: true }
}>

type ProductImage = {
  id: string
  filePath: string
  url: string | null
  productId: string
  isMain: boolean
  createdAt: Date
  size: number | null
  mimeType: string | null
}

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
        },
        images: true,
        tags: true
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
          { tags: { some: { name: { contains: searchQuery } } } }
        ],
      },
      include: {
        category: true,
        specs: {
          orderBy: {
            sortOrder: 'asc'
          }
        },
        images: true,
        tags: true
      },
      take: 10
    })
    
    return products.map(serializeProduct)
  } catch (error) {
    console.error('Error searching products:', error)
    throw new Error('Failed to search products')
  }
}

export async function getTags(search?: string) {
  try {
    return await prisma.productTag.findMany({
      where: search ? {
        name: {
          contains: search.toLowerCase(),
        }
      } : undefined,
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    console.error('Error fetching tags:', error)
    throw new Error('Failed to fetch tags')
  }
}

export async function createTag(name: string) {
  try {
    return await prisma.productTag.create({
      data: {
        name: name.toLowerCase(),
      }
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('Tag already exists')
      }
    }
    console.error('Error creating tag:', error)
    throw new Error('Failed to create tag')
  }
}

export async function deleteTag(id: string) {
  try {
    await prisma.productTag.delete({
      where: { id }
    })
  } catch (error) {
    console.error('Error deleting tag:', error)
    throw new Error('Failed to delete tag')
  }
}