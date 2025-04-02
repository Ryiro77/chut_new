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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()

    if (!body.components) {
      return new NextResponse("Missing components data", { status: 400 })
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
        userId: session?.user?.id // Optional: only set if user is logged in
      }
    })

    // Create a shared build record if the build is public
    if (build.isPublic) {
      await prisma.sharedBuild.create({
        data: {
          userId: session?.user?.id || build.id, // Use build ID as user ID for anonymous builds
          buildId: build.id,
          shareLink: createShareUrl(shortId)
        }
      })
    }

    return NextResponse.json({
      ...build,
      buildUrl: createShareUrl(shortId)
    })
  } catch (error) {
    console.error("Error creating build:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return new NextResponse("Missing build ID", { status: 400 })
    }

    const build = await prisma.pCBuild.findUnique({
      where: {
        shortId: id
      }
    })

    if (!build) {
      return new NextResponse("Build not found", { status: 404 })
    }

    // If build is not public and user is not owner, deny access
    const session = await getServerSession(authOptions)
    if (!build.isPublic && build.userId !== session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Increment view count if build is shared
    if (build.isPublic) {
      await prisma.sharedBuild.updateMany({
        where: { buildId: build.id },
        data: { views: { increment: 1 } }
      })
    }

    return NextResponse.json(build)
  } catch (error) {
    console.error("Error fetching build:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}