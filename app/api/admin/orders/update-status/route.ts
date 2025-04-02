import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email?.endsWith('@admin.com')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const formData = await request.formData()
    const orderId = formData.get('orderId') as string
    const status = formData.get('status') as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED'

    if (!orderId || !status) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    })

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Failed to update order status:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}