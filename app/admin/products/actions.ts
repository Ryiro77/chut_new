'use server'

import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import fs from 'fs/promises'
import { join } from 'path'
import crypto from 'crypto'

interface SpecInput {
  name: string;
  value: string;
  unit?: string | null;
  groupName?: string | null;
  sortOrder?: number;
  isHighlight?: boolean;
}

interface ProductImage {
  id: string;
  url: string | null;
  filePath: string;
  isMain: boolean;
}

export async function searchProducts(query: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { sku: { contains: query } },
          { brand: { contains: query } }
        ]
      },
      include: {
        category: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    })

    return products.map(product => ({
      ...product,
      regularPrice: product.regularPrice.toNumber(),
      discountedPrice: product.discountedPrice?.toNumber() ?? null
    }))
  } catch (error) {
    console.error('Failed to search products:', error)
    throw new Error('Failed to search products')
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

    return {
      ...product,
      regularPrice: product.regularPrice.toNumber(),
      discountedPrice: product.discountedPrice?.toNumber()
    }
  } catch (error) {
    console.error('Failed to fetch product:', error)
    throw new Error('Failed to fetch product')
  }
}
export async function createProduct(formData: FormData) {
  try {
    const categoryName = formData.get('componentType') as string;
    const regularPrice = formData.get('regularPrice');
    const discountedPrice = formData.get('discountedPrice');
    
    // Validate required fields
    if (!categoryName || !regularPrice) {
      throw new Error('Missing required fields');
    }

    const product = await prisma.product.create({
      data: {
        name: formData.get('name') as string,
        sku: formData.get('sku') as string,
        description: formData.get('description') as string,
        regularPrice: new Prisma.Decimal(regularPrice as string),
        discountedPrice: discountedPrice ? new Prisma.Decimal(discountedPrice as string) : null,
        isOnSale: formData.get('isOnSale') === 'on',
        stock: parseInt(formData.get('stock') as string),
        brand: formData.get('brand') as string,
        category: {
          connectOrCreate: {
            where: { name: categoryName },
            create: { 
              name: categoryName, 
              slug: categoryName.toLowerCase().replace(/\s+/g, '-') 
            },
          }
        }
      },
      include: {
        category: true
      }
    });

    return {
      ...product,
      regularPrice: product.regularPrice.toNumber(),
      discountedPrice: product.discountedPrice?.toNumber() ?? null
    };
  } catch (error) {
    console.error('Detailed create product error:', error);
    throw new Error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateProduct(id: string, formData: FormData) {
  try {
    const specs = JSON.parse(formData.get('specs') as string)
    const existingImages = JSON.parse(formData.get('existingImages') as string)
    const tags = JSON.parse(formData.get('tags') as string)

    // Get current product to compare images
    const currentProduct = await prisma.product.findUnique({
      where: { id },
      include: { images: true }
    })

    if (!currentProduct) {
      throw new Error('Product not found')
    }

    // Find removed images
    const removedImages = currentProduct.images.filter(
      currentImg => !existingImages.some((img: ProductImage) => img.id === currentImg.id)
    )

    // Delete removed image files
    for (const img of removedImages) {
      const filePath = join(process.cwd(), 'public', 'uploads', img.filePath)
      try {
        await fs.unlink(filePath)
      } catch (error) {
        console.error(`Failed to delete image file ${filePath}:`, error)
        // Continue even if file deletion fails
      }
    }

    // Handle new image uploads
    const imageFiles: File[] = []
    let index = 0
    while (formData.get(`image${index}`)) {
      const file = formData.get(`image${index}`) as File
      if (file) {
        imageFiles.push(file)
      }
      index++
    }

    // Process each new image
    const newImages = await Promise.all(imageFiles.map(async (file) => {
      // Generate unique filename using uuid and original extension
      const ext = file.name.split('.').pop()
      const filename = `${crypto.randomUUID()}.${ext}`
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'products')
      
      // Ensure upload directory exists
      await fs.mkdir(uploadDir, { recursive: true })
      
      // Convert File to Buffer and save
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Save file to disk
      const filePath = join(uploadDir, filename)
      await fs.writeFile(filePath, buffer)
      
      // Return image data for database
      return {
        filePath: `products/${filename}`,
        url: null,
        isMain: false
      }
    }))

    await prisma.product.update({
      where: { id },
      data: {
        name: formData.get('name') as string,
        sku: formData.get('sku') as string,
        description: formData.get('description') as string,
        regularPrice: new Prisma.Decimal(formData.get('regularPrice') as string),
        discountedPrice: formData.get('discountedPrice') ? new Prisma.Decimal(formData.get('discountedPrice') as string) : null,
        isOnSale: formData.get('isOnSale') === 'on',
        stock: parseInt(formData.get('stock') as string),
        brand: formData.get('brand') as string,
        specs: {
          deleteMany: {},
          create: specs.map((spec: SpecInput) => ({
            name: spec.name,
            value: spec.value,
            unit: spec.unit,
            groupName: spec.groupName,
            sortOrder: spec.sortOrder,
            isHighlight: spec.isHighlight
          }))
        },
        images: {
          // Delete removed images from database
          deleteMany: {
            id: {
              in: removedImages.map(img => img.id)
            }
          },
          // Update existing images
          updateMany: existingImages.map((img: ProductImage) => ({
            where: { id: img.id },
            data: { isMain: img.isMain }
          })),
          // Create new images
          create: newImages
        },
        tags: {
          set: tags.map((tag: string) => ({ name: tag }))
        }
      }
    })
  } catch (error) {
    console.error('Failed to update product:', error)
    throw new Error('Failed to update product')
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id }
    })
  } catch (error) {
    console.error('Failed to delete product:', error)
    throw new Error('Failed to delete product')
  }
}

export async function getTags(search?: string) {
  try {
    return await prisma.productTag.findMany({
      where: search ? {
        name: {
          contains: search
        }
      } : undefined,
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    console.error('Failed to fetch tags:', error)
    throw new Error('Failed to fetch tags')
  }
}

export async function createTag(name: string) {
  try {
    return await prisma.productTag.create({
      data: { name }
    })
  } catch (error) {
    console.error('Failed to create tag:', error)
    throw new Error('Failed to create tag')
  }
}

export async function deleteTag(id: string) {
  try {
    await prisma.productTag.delete({
      where: { id }
    })
  } catch (error) {
    console.error('Failed to delete tag:', error)
    throw new Error('Failed to delete tag')
  }
}