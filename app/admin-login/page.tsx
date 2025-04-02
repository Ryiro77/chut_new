'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Container } from '@/components/ui/container'
import { toast } from 'sonner'

function AdminLoginContent() {
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Redirect if already authenticated as admin
  useEffect(() => {
    const adminAuth = document.cookie.includes(`admin-auth=${process.env.NEXT_PUBLIC_ADMIN_PASSWORD}`)
    if (adminAuth) {
      window.location.replace('/admin/dashboard')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
        // Set the admin auth cookie
        document.cookie = `admin-auth=${password}; path=/`
        
        // Get return URL or default to dashboard
        const returnTo = searchParams.get('returnTo')
        const redirectPath = returnTo || '/admin/dashboard'
        
        // Show success message
        toast.success('Successfully logged in to admin area')
        
        // Use replace to force a page refresh and prevent going back to login
        window.location.replace(redirectPath)
      } else {
        toast.error('Invalid password')
      }
    } catch (error) {
      toast.error('Login failed')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Container>
      <div className="flex items-center justify-center min-h-screen py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>
              Enter the admin password to continue
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Container>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <Container>
        <div className="flex items-center justify-center min-h-screen py-12">
          <Card className="w-full max-w-md p-6">
            <div className="text-center">Loading...</div>
          </Card>
        </div>
      </Container>
    }>
      <AdminLoginContent />
    </Suspense>
  )
}