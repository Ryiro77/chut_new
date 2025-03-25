import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Replace this with your actual WhatsApp API integration
async function sendWhatsAppOTP(phone: string, otp: string) {
  // TODO: Integrate with WhatsApp Business API
  // For now, just console log
  console.log(`Sending OTP ${otp} to ${phone}`);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP in database
    await prisma.oTPVerification.create({
      data: {
        phone,
        otp,
        expiresAt,
        verified: false
      }
    });

    // Send OTP via WhatsApp
    await sendWhatsAppOTP(phone, otp);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone and OTP are required' },
        { status: 400 }
      );
    }

    // Find and verify OTP
    const verification = await prisma.oTPVerification.findFirst({
      where: {
        phone,
        otp,
        verified: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await prisma.oTPVerification.update({
      where: { id: verification.id },
      data: { verified: true }
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          isVerified: true
        }
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}