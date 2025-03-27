import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

type CartItemInput = {
  id: string;
  name: string;
  brand: string;
  regularPrice: number;
  discountedPrice?: number;
  isOnSale: boolean;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        product: {
          include: {
            category: true,
            specs: true,
            images: true
          }
        }
      }
    });

    // Transform Decimal values to numbers
    return NextResponse.json(cartItems.map(item => ({
      ...item,
      product: {
        ...item.product,
        regularPrice: item.product.regularPrice.toNumber(),
        discountedPrice: item.product.discountedPrice?.toNumber()
      }
    })));

  } catch (error) {
    console.error('Failed to fetch cart items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { items, customBuildName } = body;

    // Process each item
    const cartItems = await Promise.all(items.map(async (item: CartItemInput) => {
      const cartItem = await prisma.cartItem.create({
        data: {
          userId: session.user.id,
          productId: item.id,
          quantity: 1,
          customBuildName
        },
        include: {
          product: {
            include: {
              category: true,
              specs: true,
              images: true
            }
          }
        }
      });

      return {
        ...cartItem,
        product: {
          ...cartItem.product,
          regularPrice: cartItem.product.regularPrice.toNumber(),
          discountedPrice: cartItem.product.discountedPrice?.toNumber()
        }
      };
    }));

    return NextResponse.json(cartItems);
  } catch (error) {
    console.error('Failed to add item to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { cartItemId, quantity } = await request.json();

    const cartItem = await prisma.cartItem.update({
      where: {
        id: cartItemId,
        userId: session.user.id
      },
      data: {
        quantity
      },
      include: {
        product: true
      }
    });

    // Transform the response
    return NextResponse.json({
      ...cartItem,
      product: {
        ...cartItem.product,
        regularPrice: cartItem.product.regularPrice.toNumber(),
        discountedPrice: cartItem.product.discountedPrice?.toNumber()
      }
    });
  } catch (error) {
    console.error('Failed to update cart item:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const itemId = request.nextUrl.searchParams.get('id');
    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    await prisma.cartItem.delete({
      where: {
        id: itemId,
        userId: session.user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove item from cart:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
}