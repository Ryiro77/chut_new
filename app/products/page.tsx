import { Suspense } from 'react'
import ProductsContent from './components/ProductsContent'
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Loader2 } from "lucide-react"

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Suspense 
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        }
      >
        <ProductsContent />
      </Suspense>
      <Footer />
    </div>
  )
}