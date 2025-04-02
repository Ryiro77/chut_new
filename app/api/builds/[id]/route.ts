import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

interface RouteParams {
  params: {
    id: string;
  };
}

export async function DELETE(
  request: Request,
  { params }: RouteParams & { params: Promise<RouteParams['params']> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get the build first to check ownership
    const build = await prisma.pCBuild.findUnique({
      where: { shortId: id }
    })

    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 })
    }

    // Check if the user owns the build
    if (build.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete associated shared build record if it exists
    if (build.isPublic) {
      await prisma.sharedBuild.deleteMany({
        where: { buildId: build.id }
      })
    }

    // Delete the build
    await prisma.pCBuild.delete({
      where: { id: build.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete build:', error)
    return NextResponse.json(
      { error: 'Failed to delete build' },
      { status: 500 }
    )
  }
}