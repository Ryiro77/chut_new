import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

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
        images: true
      }
    });

    // Transform Decimal values to numbers
    const transformedProducts = products.map(product => ({
      ...product,
      regularPrice: product.regularPrice.toNumber(),
      discountedPrice: product.discountedPrice?.toNumber(),
      specs: product.specs.map(spec => ({
        ...spec,
        sortOrder: spec.sortOrder || 0
      }))
    }));

    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}