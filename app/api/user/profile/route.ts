import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    images: true
                  }
                }
              }
            },
            shippingAddress: true
          }
        },
        pcBuilds: {
          orderBy: { createdAt: 'desc' },
          where: { isPublic: false }
        }
      }
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const data = await request.json()
    
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: data.name,
        address: data.address,
        email: data.email,
        phone: data.phone
      }
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile update error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}