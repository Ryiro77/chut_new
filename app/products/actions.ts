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
          // Price range filter (using discountedPrice if available, otherwise regularPrice)
          {
            OR: [
              {
                AND: [
                  { isOnSale: true },
                  {
                    discountedPrice: {
                      gte: minPrice ? new Decimal(minPrice) : undefined,
                      lte: maxPrice ? new Decimal(maxPrice) : undefined,
                    }
                  }
                ]
              },
              {
                OR: [
                  { isOnSale: false },
                  { discountedPrice: null }
                ],
                regularPrice: {
                  gte: minPrice ? new Decimal(minPrice) : undefined,
                  lte: maxPrice ? new Decimal(maxPrice) : undefined,
                }
              }
            ]
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
      regularPrice: product.regularPrice.toNumber(),
      discountedPrice: product.discountedPrice?.toNumber(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    }))
  } catch (error) {
    console.error('Error fetching products:', error)
    throw new Error('Failed to fetch products')
  }
}