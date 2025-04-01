'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Container } from '@/components/ui/container'
import { toast } from 'sonner'

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      // Set the admin auth cookie
      document.cookie = `admin-auth=${password}; path=/`
      
      // Redirect back to the original URL or admin dashboard
      const returnTo = searchParams.get('returnTo') || '/admin/dashboard'
      router.push(returnTo)
      toast.success('Successfully logged in to admin area')
    } else {
      toast.error('Invalid password')
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
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Login
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