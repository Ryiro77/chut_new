import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { Component } from "@/lib/types"

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

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const latestBuild = await prisma.pCBuild.findFirst({
      where: {
        userId: session.user.id
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    if (!latestBuild) {
      return NextResponse.json({ error: "No builds found" }, { status: 404 })
    }

    // Transform the build data to ensure proper JSON serialization
    return NextResponse.json({
      ...latestBuild,
      totalPrice: latestBuild.totalPrice.toNumber(),
      components: Object.entries(latestBuild.components as unknown as Record<string, StoredComponent>).reduce((acc, [key, comp]) => ({
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
    console.error("Error fetching latest build:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}