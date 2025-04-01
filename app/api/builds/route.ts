import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nanoid } from 'nanoid';
import { Component } from "@/lib/types";
import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";

type ComponentsMap = Record<string, Component>;

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { components } = data as { components: ComponentsMap };

    const shortId = nanoid(6);
    const totalPrice = Object.values(components)
      .reduce((sum: number, comp: Component) => {
        return sum + (typeof comp.price === 'number' ? comp.price : 0);
      }, 0);

    await prisma.pCBuild.create({
      data: {
        shortId,
        name: `Build ${shortId}`,
        components: components as unknown as Prisma.InputJsonValue,
        totalPrice: new Decimal(totalPrice),
        isPublic: true,
      }
    });

    const buildUrl = `${request.nextUrl.origin}/pc-builder?id=${shortId}`;
    return NextResponse.json({ shortId, buildUrl });
  } catch (error) {
    console.error('Build creation error:', error);
    return NextResponse.json({ error: 'Failed to create build' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Build ID is required' }, { status: 400 });
    }

    const build = await prisma.pCBuild.findUnique({
      where: { shortId: id }
    });

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: build.id,
      shortId: build.shortId,
      name: build.name,
      components: build.components,
      totalPrice: build.totalPrice.toNumber(),
      isPublic: build.isPublic,
      createdAt: build.createdAt
    });
  } catch (error) {
    console.error('Build fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch build' }, { status: 500 });
  }
}