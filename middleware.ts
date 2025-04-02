import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })
  
  // Protect auth page from logged in users
  if (request.nextUrl.pathname === '/auth') {
    if (token) {
      const callbackUrl = request.nextUrl.searchParams.get('callbackUrl')
      return NextResponse.redirect(new URL(callbackUrl || '/', request.nextUrl.origin))
    }
    return NextResponse.next()
  }

  // Handle admin login page
  if (request.nextUrl.pathname === '/admin-login') {
    const adminAuth = request.cookies.get('admin-auth')?.value
    
    // If already authenticated as admin, redirect to returnTo or stay on current page
    if (adminAuth === process.env.ADMIN_PASSWORD) {
      const returnTo = request.nextUrl.searchParams.get('returnTo')
      if (returnTo) {
        return NextResponse.redirect(new URL(returnTo, request.nextUrl.origin))
      }
      return NextResponse.next()
    }
    return NextResponse.next()
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check if admin password is configured
    if (!process.env.ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD environment variable is not set')
      return new NextResponse('Server configuration error', { status: 500 })
    }

    const adminAuth = request.cookies.get('admin-auth')?.value
    
    // If no admin auth cookie exists or it doesn't match our password
    if (!adminAuth || adminAuth !== process.env.ADMIN_PASSWORD) {
      const returnTo = request.nextUrl.pathname + request.nextUrl.search
      return NextResponse.redirect(new URL(`/admin-login?returnTo=${encodeURIComponent(returnTo)}`, request.nextUrl.origin))
    }
    return NextResponse.next()
  }

  // Protect user-specific routes
  if (
    request.nextUrl.pathname.startsWith('/account') || 
    request.nextUrl.pathname.startsWith('/orders')
  ) {
    if (!token) {
      const callbackUrl = request.nextUrl.pathname + request.nextUrl.search
      return NextResponse.redirect(
        new URL(`/auth?callbackUrl=${encodeURIComponent(callbackUrl)}`, request.nextUrl.origin)
      )
    }
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/admin/:path*',
    '/admin-login',
    '/auth',
    '/account/:path*',
    '/orders/:path*'
  ]
}