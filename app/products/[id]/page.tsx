import { prisma } from '@/lib/db'
import { Container } from '@/components/ui/container'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import ProductDetail from './ProductDetail'

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  // Await the params to resolve the dynamic segment
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      specs: {
        orderBy: {
          sortOrder: 'asc'
        }
      },
      images: true,
      tags: true,
      reviews: {
        include: {
          user: {
            select: {
              name: true,
              profilePicture: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!product) {
    notFound()
  }

  // Transform the product data for the ProductDetail component
  const productForDetail = {
    ...product,
    regularPrice: product.regularPrice.toNumber(),
    discountedPrice: product.discountedPrice?.toNumber(),
  }

  // Group specifications by groupName
  const groupedSpecs = product.specs.reduce((acc, spec) => {
    const group = spec.groupName || 'General'
    if (!acc[group]) acc[group] = []
    acc[group].push(spec)
    return acc
  }, {} as Record<string, typeof product.specs>)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <Container className="py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images and Cart Controls */}
        <ProductDetail product={productForDetail} />

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="mt-2 space-x-2">
              <Badge>{product.category.name}</Badge>
              {product.tags.map(tag => (
                <Badge key={tag.id} variant="outline">{tag.name}</Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-lg font-semibold text-muted-foreground">Brand: {product.brand}</p>
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
          </div>

          <div className="space-y-1">
            {product.isOnSale && product.discountedPrice ? (
              <>
                <p className="text-3xl font-bold">{formatPrice(product.discountedPrice.toNumber())}</p>
                <p className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.regularPrice.toNumber())}
                </p>
                <p className="text-sm text-green-600 font-medium">
                  Save {formatPrice(product.regularPrice.toNumber() - product.discountedPrice.toNumber())}
                  {' '}({Math.round((1 - product.discountedPrice.toNumber() / product.regularPrice.toNumber()) * 100)}% off)
                </p>
              </>
            ) : (
              <p className="text-3xl font-bold">{formatPrice(product.regularPrice.toNumber())}</p>
            )}
          </div>

          <div>
            <p className="text-muted-foreground">{product.description}</p>
          </div>

          <div className="space-y-2">
            <p className="font-medium">Stock Status:</p>
            {product.stock > 0 ? (
              <Badge variant="default" className="bg-green-500">
                In Stock ({product.stock} units)
              </Badge>
            ) : (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Specifications */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.entries(groupedSpecs).map(([groupName, specs]) => (
              <div key={groupName}>
                <h3 className="text-lg font-semibold mb-2">{groupName}</h3>
                <div className="space-y-2">
                  {specs.map(spec => (
                    <div key={spec.id} className="flex justify-between">
                      <span className="text-muted-foreground">{spec.name}</span>
                      <span className="font-medium">
                        {spec.value}{spec.unit ? ` ${spec.unit}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Customer Reviews</h2>
            <div className="flex items-center gap-2">
              {typeof product.averageRating === 'number' && (
                <>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="text-yellow-400 text-xl">
                        {star <= Math.round(product.averageRating!) ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                  <span className="text-lg font-medium">{product.averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({product.reviewCount} reviews)</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {product.reviews.map((review) => (
              <div key={review.id} className="border-b pb-4">
                <div className="flex items-center gap-2 mb-2">
                  {review.user.profilePicture && (
                    <Image
                      src={review.user.profilePicture}
                      alt={review.user.name || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium">{review.user.name || 'Anonymous'}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="text-yellow-400">
                          {star <= review.rating ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">{review.comment}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Container>
  )
}