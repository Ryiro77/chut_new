import { prisma } from '@/lib/db'
import { Container } from '@/components/ui/container'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'

export default async function AdminOrders() {
  const orders = await prisma.order.findMany({
    include: {
      user: true,
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
      </div>

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
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">
                    {order.user.name || order.user.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-medium">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium">{formatPrice(Number(order.finalAmount))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment</p>
                  <p className="font-medium capitalize">{order.paymentStatus.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <form action="/api/admin/orders/update-status" method="POST">
                    <input type="hidden" name="orderId" value={order.id} />
                    <Select name="status" defaultValue={order.status}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PROCESSING">Processing</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="SHIPPED">Shipped</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </form>
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
                  Phone: {order.shippingAddress?.phone}<br />
                  Email: {order.shippingAddress?.email}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  )
}