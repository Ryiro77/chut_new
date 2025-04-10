import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.trim();
    const category = searchParams.get('category')?.trim();
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const filtersParam = searchParams.get('filters');
    const filters = filtersParam ? JSON.parse(filtersParam) : undefined;

    const where: Prisma.ProductWhereInput = {};
    const conditions: Prisma.ProductWhereInput[] = [];

    // Category filter
    if (category) {
      conditions.push({
        category: {
          name: category
        }
      });
    }

    // Price filter
    if (minPrice || maxPrice) {
      conditions.push({
        OR: [
          {
            isOnSale: true,
            discountedPrice: {
              not: null,
              gte: minPrice ? new Prisma.Decimal(minPrice) : undefined,
              lte: maxPrice ? new Prisma.Decimal(maxPrice) : undefined,
            }
          },
          {
            OR: [
              { isOnSale: false },
              { discountedPrice: null }
            ],
            regularPrice: {
              gte: minPrice ? new Prisma.Decimal(minPrice) : undefined,
              lte: maxPrice ? new Prisma.Decimal(maxPrice) : undefined,
            }
          }
        ]
      });
    }

    // Search filter
    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
          { brand: { contains: search } },
          { description: { contains: search } }
        ]
      });
    }

    // Specs filter
    if (filters && Object.keys(filters).length > 0) {
      const specFilters = Object.entries(filters).map(([name, values]) => ({
        AND: [
          { name },
          { value: { in: values as string[] } }
        ]
      })) as Prisma.ProductSpecificationWhereInput[];

      conditions.push({
        specs: {
          some: {
            OR: specFilters
          }
        }
      });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        specs: {
          orderBy: { sortOrder: 'asc' }
        },
        images: true,
        tags: true
      },
      orderBy: [
        { isOnSale: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(
      products.map(product => ({
        ...product,
        regularPrice: product.regularPrice.toNumber(),
        discountedPrice: product.discountedPrice?.toNumber() ?? null
      }))
    );
  } catch (error) {
    console.error('Product search error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' }, 
      { status: 500 }
    );
  }
}