import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET /api/cart - Get all cart items for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      // Return 401 for unauthenticated users - client will handle local storage
      return new Response(null, { status: 401 });
    }

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

// POST /api/cart - Add items to cart
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { items, customBuildName } = body;

    if (!session) {
      // For unauthenticated users, just return success
      // Client will handle storing in localStorage
      return NextResponse.json({ success: true }, { status: 401 });
    }

    // Process each item for authenticated users
    const cartItems = await Promise.all(items.map(async (item: { id: string; quantity?: number }) => {
      // Check if item already exists in cart
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          userId: session.user.id,
          productId: item.id,
        }
      });

      let cartItem;
      if (existingItem) {
        // Update existing item's quantity, respecting the limit of 8
        cartItem = await prisma.cartItem.update({
          where: {
            id: existingItem.id,
          },
          data: {
            quantity: Math.min(existingItem.quantity + (item.quantity || 1), 8),
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
      } else {
        // Create new cart item
        cartItem = await prisma.cartItem.create({
          data: {
            userId: session.user.id,
            productId: item.id,
            quantity: Math.min(item.quantity || 1, 8),
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
      }

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
    console.error('Failed to add items to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add items to cart' },
      { status: 500 }
    );
  }
}

// PUT /api/cart - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { cartItemId, quantity } = body;

    if (!session) {
      // For unauthenticated users, return unauthorized
      return NextResponse.json({ success: true }, { status: 401 });
    }

    const cartItem = await prisma.cartItem.update({
      where: {
        id: cartItemId,
        userId: session.user.id
      },
      data: {
        quantity: Math.min(Math.max(1, quantity), 8) // Ensure quantity is between 1 and 8
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

// DELETE /api/cart?id={cartItemId} - Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('id');

    if (!cartItemId) {
      return NextResponse.json(
        { error: 'Cart item ID is required' },
        { status: 400 }
      );
    }

    if (!session) {
      // For unauthenticated users, return unauthorized
      return NextResponse.json({ success: true }, { status: 401 });
    }

    await prisma.cartItem.delete({
      where: {
        id: cartItemId,
        userId: session.user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove cart item:', error);
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}