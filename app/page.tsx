import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        <Container className="space-y-12 py-8">
          {/* Hero Section */}
          <section className="text-center py-12 px-4 rounded-lg bg-muted">
            <h2 className="text-4xl font-bold mb-4">Build Your Dream PC</h2>
            <p className="text-muted-foreground mb-6">
              Choose from our wide range of components or use our PC Builder
            </p>
            <Button asChild size="lg">
              <Link href="/pc-builder">Start Building</Link>
            </Button>
          </section>

          {/* Featured Products Section */}
          <section>
            <h3 className="text-2xl font-semibold mb-6">Featured Products</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle>Product {i}</CardTitle>
                    <CardDescription>High-performance component</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-square bg-muted rounded-md"></div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">View Details</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>

          {/* Categories Section */}
          <section>
            <h3 className="text-2xl font-semibold mb-6">Browse Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['CPUs', 'GPUs', 'Motherboards', 'Storage'].map((category) => (
                <Card key={category} className="hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-muted rounded-md"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </Container>
      </main>

      <Footer />
    </div>
  )
}
