'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Container } from "@/components/ui/container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNow } from 'date-fns'

interface UserData {
  name: string | null
  email: string | null
  phone: string
  address: string | null
  orders: Array<{
    id: string
    status: string
    totalAmount: number
    createdAt: string
    items: Array<{
      quantity: number
      product: {
        name: string
        brand: string
        images: Array<{
          url?: string
          filePath?: string
          isMain: boolean
        }>
      }
    }>
  }>
  pcBuilds: Array<{
    id: string
    shortId: string
    name: string
    components: Record<string, Component>
    createdAt: string
  }>
}

interface Component {
  type: string
  id: string | null
  name: string | null
  brand: string | null
  price: number | null
}

export default function AccountPage() {
  const { data: session, update: updateSession } = useSession()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (!response.ok) throw new Error('Failed to fetch user data')
        const data = await response.json()
        setUserData(data.user)
        setProfileData({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          address: data.user.address || ''
        })
      } catch (error) {
        console.error('Failed to load user data:', error)
        toast.error('Failed to load user data')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchUserData()
    }
  }, [session])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })
      
      if (!response.ok) throw new Error('Failed to update profile')

      // Get the updated user data from response
      const { user } = await response.json()
      
      // Update the session with new profile data
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: user.name,
          email: user.email,
          phone: user.phone
        }
      })
      
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBuild = async (buildId: string, shortId: string) => {
    try {
      const response = await fetch(`/api/builds/${shortId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete build');
      }
      
      // Update UI by removing the deleted build
      setUserData(prev => prev ? {
        ...prev,
        pcBuilds: prev.pcBuilds.filter(build => build.id !== buildId)
      } : null);
      
      toast.success('Build deleted');
    } catch (error) {
      console.error('Failed to delete build:', error);
      toast.error('Failed to delete build');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Container className="py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <Container className="py-8">
          <h1 className="text-2xl font-bold mb-6">My Account</h1>
          
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="builds">Saved Builds</TabsTrigger>
              <TabsTrigger value="orders">Order History</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={e => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={e => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={e => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={e => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="builds" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Saved PC Builds</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!userData?.pcBuilds?.length ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">You haven&apos;t saved any PC builds yet</p>
                        <Button asChild>
                          <Link href="/pc-builder">Create New Build</Link>
                        </Button>
                      </div>
                    ) : (
                      <>
                        {userData?.pcBuilds.map(build => (
                          <Card key={build.id}>
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium mb-1">{build.name || 'Unnamed Build'}</h3>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Created {formatDistanceToNow(new Date(build.createdAt), { addSuffix: true })}
                                  </p>
                                  <div className="space-y-1">
                                    {Object.entries(build.components).map(([type, component]) => (
                                      component.id && (
                                        <p key={type} className="text-sm">
                                          {type}: {component.name} ({component.brand})
                                        </p>
                                      )
                                    ))}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button asChild size="sm">
                                    <Link href={`/pc-builder?id=${build.shortId}`}>
                                      Edit Build
                                    </Link>
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => handleDeleteBuild(build.id, build.shortId)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        <Button asChild>
                          <Link href="/pc-builder">Create New Build</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!userData?.orders?.length ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">You haven&apos;t placed any orders yet</p>
                        <Button asChild>
                          <Link href="/products">Browse Products</Link>
                        </Button>
                      </div>
                    ) : (
                      <>
                        {userData?.orders.map(order => (
                          <Card key={order.id}>
                            <CardContent className="p-6">
                              <div className="flex flex-col space-y-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Order ID: {order.id}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Placed {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <Badge variant={
                                      order.status === 'DELIVERED' ? 'success' :
                                      order.status === 'CANCELLED' ? 'destructive' : 'default'
                                    }>
                                      {order.status}
                                    </Badge>
                                    <p className="font-medium mt-1">₹{formatPrice(order.totalAmount)}</p>
                                  </div>
                                </div>
                                <div className="border-t pt-4">
                                  <div className="space-y-4">
                                    {order.items.map((item, index) => (
                                      <div key={index} className="flex gap-4">
                                        <div className="relative h-16 w-16 flex-shrink-0">
                                          <Image
                                            src={
                                              item.product.images.find(img => img.isMain)?.url ||
                                              `/uploads/${item.product.images.find(img => img.isMain)?.filePath ||
                                              item.product.images[0]?.filePath}` ||
                                              '/no-image.png'
                                            }
                                            alt={item.product.name}
                                            fill
                                            className="object-contain rounded-md"
                                          />
                                        </div>
                                        <div>
                                          <p className="font-medium">{item.product.name}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {item.product.brand} • Quantity: {item.quantity}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Container>
      </main>

      <Footer />
    </div>
  )
}