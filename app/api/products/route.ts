import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search')?.trim();
    
    if (!search) {
      return NextResponse.json([]);
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
          { brand: { contains: search } }
        ]
      },
      include: {
        category: true,
        images: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    return NextResponse.json(products.map(product => ({
      ...product,
      regularPrice: product.regularPrice.toNumber(),
      discountedPrice: product.discountedPrice?.toNumber()
    })));
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json([], { status: 500 });
  }
}