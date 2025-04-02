import { nanoid } from 'nanoid'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { Component } from '@/lib/types'

// Utility to create share URL
const createShareUrl = (shortId: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/pc-builder?id=${shortId}`
}

interface ComponentMap {
  [key: string]: Component;
}

interface StoredComponent {
  type: string;
  id: string | null;
  name: string | null;
  price: number | null;
  brand: string | null;
  image?: string;
  specs?: Array<{
    name: string;
    value: string;
    unit?: string | null;
  }>;
  isOnSale?: boolean;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()

    if (!body.components) {
      return NextResponse.json({ error: "Missing components data" }, { status: 400 })
    }

    // Create a new build with a unique short ID
    const shortId = nanoid(10)
    
    const build = await prisma.pCBuild.create({
      data: {
        shortId,
        name: body.name || 'Untitled Build',
        components: body.components,
        totalPrice: Object.values(body.components as ComponentMap).reduce((sum, comp) => 
          sum + (comp.price || 0), 0
        ),
        isPublic: body.isPublic ?? true,
        userId: session?.user?.id
      }
    })

    // Create a shared build record if the build is public
    if (build.isPublic) {
      await prisma.sharedBuild.create({
        data: {
          userId: session?.user?.id || build.id,
          buildId: build.id,
          shareLink: createShareUrl(shortId)
        }
      })
    }

    // Transform the response data
    return NextResponse.json({
      ...build,
      totalPrice: build.totalPrice.toNumber(),
      components: Object.entries(build.components as unknown as Record<string, StoredComponent>).reduce((acc, [key, comp]) => ({
        ...acc,
        [key]: {
          type: comp.type,
          id: comp.id,
          name: comp.name,
          price: comp.price ? parseFloat(comp.price.toString()) : null,
          brand: comp.brand,
          image: comp.image,
          specs: comp.specs,
          isOnSale: comp.isOnSale
        }
      }), {} as ComponentMap),
      buildUrl: createShareUrl(shortId)
    })
  } catch (error) {
    console.error("Error creating build:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Missing build ID" }, { status: 400 })
    }

    const build = await prisma.pCBuild.findUnique({
      where: {
        shortId: id
      }
    })

    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 })
    }

    // Get the current user's session
    const session = await getServerSession(authOptions)

    // Allow access if:
    // 1. Build is public, OR
    // 2. User is logged in and owns the build
    if (!build.isPublic && (!session?.user?.id || build.userId !== session.user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Increment view count if build is shared
    if (build.isPublic) {
      await prisma.sharedBuild.updateMany({
        where: { buildId: build.id },
        data: { views: { increment: 1 } }
      })
    }

    // Transform the response data
    return NextResponse.json({
      ...build,
      totalPrice: build.totalPrice.toNumber(),
      components: Object.entries(build.components as unknown as Record<string, StoredComponent>).reduce((acc, [key, comp]) => ({
        ...acc,
        [key]: {
          type: comp.type,
          id: comp.id,
          name: comp.name,
          price: comp.price ? parseFloat(comp.price.toString()) : null,
          brand: comp.brand,
          image: comp.image,
          specs: comp.specs,
          isOnSale: comp.isOnSale
        }
      }), {} as ComponentMap)
    })
  } catch (error) {
    console.error("Error fetching build:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}