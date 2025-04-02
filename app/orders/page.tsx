import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Container } from '@/components/ui/container'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'

export default async function OrdersPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return (
      <Container className="py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-muted-foreground">You need to be signed in to view your orders.</p>
          <Link href="/auth" className="text-primary hover:underline mt-4 inline-block">
            Go to Sign In
          </Link>
        </div>
      </Container>
    )
  }

  const orders = await prisma.order.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true
            }
          }
        }
      },
      shippingAddress: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">You haven&apos;t placed any orders yet.</p>
          <Link href="/products" className="text-primary hover:underline">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order placed</p>
                    <p className="font-medium">
                      {formatDistanceToNow(order.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-medium">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-medium">{formatPrice(Number(order.finalAmount))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{order.status.toLowerCase()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-4 flex gap-4">
                      <div className="relative h-20 w-20 bg-muted rounded-lg overflow-hidden">
                        <Image
                          src={
                            item.product.images.find(img => img.isMain)?.url || 
                            `/uploads/${item.product.images.find(img => img.isMain)?.filePath || 
                            item.product.images[0]?.filePath}` ||
                            '/no-image.png'
                          }
                          alt={item.product.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × {formatPrice(Number(item.price))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 border-t pt-6">
                  <h4 className="font-medium mb-2">Shipping Address</h4>
                  <p className="text-sm text-muted-foreground">
                    {order.shippingAddress?.fullName}<br />
                    {order.shippingAddress?.address}<br />
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}<br />
                    Phone: {order.shippingAddress?.phone}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Container>
  )
}