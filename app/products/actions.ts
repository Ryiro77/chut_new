'use server'

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

type GetProductsParams = {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  filters?: Record<string, string[]>;
}

export async function getProducts({ category, minPrice, maxPrice, search, filters }: GetProductsParams = {}) {
  try {
    const products = await prisma.product.findMany({
      where: {
        AND: [
          // Category filter
          category ? {
            category: {
              name: category
            }
          } : {},
          // Price range filter
          {
            price: {
              gte: minPrice ? new Decimal(minPrice) : undefined,
              lte: maxPrice ? new Decimal(maxPrice) : undefined,
            }
          },
          // Search filter
          search ? {
            OR: [
              { name: { contains: search } },
              { brand: { contains: search } },
              { description: { contains: search } }
            ]
          } : {},
          // Spec filters - if any specs match the filter values
          filters && Object.keys(filters).length > 0 ? {
            specs: {
              some: {
                OR: Object.entries(filters).map(([name, values]) => ({
                  AND: [
                    { name },
                    { value: { in: values } }
                  ]
                }))
              }
            }
          } : {}
        ]
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    return products.map(product => ({
      ...product,
      price: product.price.toNumber(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    }))
  } catch (error) {
    console.error('Error fetching products:', error)
    throw new Error('Failed to fetch products')
  }
}