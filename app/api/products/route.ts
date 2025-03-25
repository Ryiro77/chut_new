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
    });

    return NextResponse.json(products.map(product => ({
      ...product,
      price: product.price.toNumber(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    })));
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}