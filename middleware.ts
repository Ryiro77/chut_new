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
      // If user is logged in, redirect to callback URL or home
      return NextResponse.redirect(new URL(callbackUrl || '/', request.nextUrl.origin))
    }
    return NextResponse.next()
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const adminAuth = request.cookies.get('admin-auth')
    const adminPassword = process.env.ADMIN_PASSWORD
    
    // If no admin auth cookie exists or it doesn't match our password
    if (!adminAuth || adminAuth.value !== adminPassword) {
      // Get the full URL they were trying to visit
      const returnTo = request.nextUrl.pathname + request.nextUrl.search
      
      // Create an absolute URL for the login page
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
      // If user is not logged in, redirect to login with callback
      const callbackUrl = request.nextUrl.pathname + request.nextUrl.search
      return NextResponse.redirect(
        new URL(`/auth?callbackUrl=${encodeURIComponent(callbackUrl)}`, request.nextUrl.origin)
      )
    }
    return NextResponse.next()
  }
  
  // If we're on admin-login page and already authenticated as admin
  if (request.nextUrl.pathname === '/admin-login') {
    const adminAuth = request.cookies.get('admin-auth')
    const adminPassword = process.env.ADMIN_PASSWORD
    
    if (adminAuth?.value === adminPassword) {
      const returnTo = request.nextUrl.searchParams.get('returnTo')
      return NextResponse.redirect(new URL(returnTo || '/admin/dashboard', request.nextUrl.origin))
    }
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