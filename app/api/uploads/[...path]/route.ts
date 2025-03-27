import type { NextRequest } from 'next/server'

export const dynamic = 'auto'
export const dynamicParams = true

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  try {
    const params = await context.params
    const filePath = params.path.join('/')

    const { join } = await import('path')
    const { promises: fs } = await import('fs')
    const { stat } = await import('fs/promises')

    const fullPath = join(process.cwd(), 'public', 'uploads', filePath)

    try {
      const stats = await stat(fullPath)
      if (!stats.isFile()) {
        return new Response('Not found', { status: 404 })
      }

      const buffer = await fs.readFile(fullPath)
      const contentType = getContentType(filePath)

      return new Response(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
          'Content-Length': String(stats.size),
        },
      })
    } catch {
      return new Response('Not found', { status: 404 })
    }
  } catch {
    return new Response('Internal Server Error', { status: 500 })
  }
}

function getContentType(filePath: string): string {
  const extension = filePath.toLowerCase().split('.').pop()
  const contentTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml'
  }
  return contentTypes[extension || ''] || 'application/octet-stream'
}
