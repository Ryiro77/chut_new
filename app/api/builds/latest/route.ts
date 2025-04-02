import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get the user's most recent build
    const latestBuild = await prisma.pCBuild.findFirst({
      where: {
        userId: session.user.id,
        isPublic: false,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    if (!latestBuild) {
      return new NextResponse("No builds found", { status: 404 })
    }

    return NextResponse.json(latestBuild)
  } catch (error) {
    console.error("Error fetching latest build:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}