import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { razorpay } from '@/lib/razorpay';
import crypto from 'crypto';
import { CartItem, CheckoutFormData } from '@/lib/types';

const prisma = new PrismaClient();

// Verify Razorpay webhook signature
function verifyWebhookSignature(
  razorpay_signature: string,
  razorpay_payment_id: string,
  razorpay_order_id: string
) {
  const text = `${razorpay_order_id}|${razorpay_payment_id}`;
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(text)
    .digest('hex');
  
  return razorpay_signature === generated_signature;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, shippingDetails }: { 
      items: CartItem[];
      shippingDetails: CheckoutFormData;
    } = await request.json();

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum: number, item: CartItem) => sum + (item.product.price * item.quantity),
      0
    );

    // Create order in database first
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: 'PENDING',
        totalAmount,
        discountAmount: 0,
        finalAmount: totalAmount,
        address: shippingDetails.address, // Store simplified address
        shippingAddress: {
          create: {
            fullName: shippingDetails.name,
            email: shippingDetails.email,
            phone: shippingDetails.phone,
            address: shippingDetails.address,
            city: shippingDetails.city,
            state: shippingDetails.state,
            pincode: shippingDetails.pincode,
          }
        },
        items: {
          create: items.map((item: CartItem) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price
          }))
        }
      },
      include: {
        shippingAddress: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (shippingDetails.paymentMethod === 'online') {
      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: totalAmount * 100, // Convert to paise
        currency: 'INR',
        receipt: order.id,
        notes: {
          orderId: order.id,
          userId: session.user.id
        }
      });

      // Update order with Razorpay order ID
      await prisma.order.update({
        where: { id: order.id },
        data: {
          razorpayOrderId: razorpayOrder.id,
          paymentStatus: 'PENDING'
        }
      });

      // Clear cart after order creation
      await prisma.cartItem.deleteMany({
        where: {
          userId: session.user.id
        }
      });

      return NextResponse.json({
        success: true,
        paymentMethod: 'online',
        order: {
          ...order,
          razorpay: {
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
          }
        }
      });
    } else {
      // COD order
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'COD',
          status: 'CONFIRMED'
        }
      });

      // Clear cart after order creation
      await prisma.cartItem.deleteMany({
        where: {
          userId: session.user.id
        }
      });

      return NextResponse.json({
        success: true,
        paymentMethod: 'cod',
        order
      });
    }
  } catch (error) {
    console.error('Error processing checkout:', error);
    return NextResponse.json(
      { error: 'Failed to process checkout' },
      { status: 500 }
    );
  }
}

// Webhook handler for Razorpay payment verification
export async function PUT(request: NextRequest) {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = await request.json();

    // Verify signature
    if (!verifyWebhookSignature(razorpay_signature, razorpay_payment_id, razorpay_order_id)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    await prisma.order.update({
      where: {
        id: order.id
      },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        paidAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}