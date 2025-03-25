import { NextResponse } from 'next/server'
import { join } from 'path'
import { promises as fs } from 'fs'
import { stat } from 'fs/promises'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const filePath = decodeURIComponent(url.pathname.replace('/api/uploads/', ''))
  const fullPath = join(process.cwd(), 'public/uploads', filePath)

  try {
    const stats = await stat(fullPath)
    if (!stats.isFile()) {
      return new NextResponse('Not found', { status: 404 })
    }

    const buffer = await fs.readFile(fullPath)
    const headers = new Headers()
    
    // Set content type based on file extension
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      headers.set('Content-Type', 'image/jpeg')
    } else if (filePath.endsWith('.png')) {
      headers.set('Content-Type', 'image/png')
    } else if (filePath.endsWith('.gif')) {
      headers.set('Content-Type', 'image/gif')
    } else if (filePath.endsWith('.webp')) {
      headers.set('Content-Type', 'image/webp')
    }

    return new NextResponse(buffer, {
      headers,
      status: 200,
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return new NextResponse('Not found', { status: 404 })
  }
}