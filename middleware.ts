import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only run middleware on admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const adminAuth = request.cookies.get('admin-auth')
    const adminPassword = process.env.ADMIN_PASSWORD
    
    // If no admin auth cookie exists or it doesn't match our password
    if (!adminAuth || adminAuth.value !== adminPassword) {
      // Store the original URL they were trying to visit
      const returnTo = request.nextUrl.pathname + request.nextUrl.search
      
      // Redirect to admin login with return URL
      const loginUrl = new URL('/admin-login', request.url)
      loginUrl.searchParams.set('returnTo', returnTo)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
  matcher: '/admin/:path*'
}