import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <Container className="py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h4 className="font-semibold mb-4">PC Builder</h4>
            <p className="text-muted-foreground">Your one-stop shop for custom PC builds and components</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {['Products', 'PC Builder', 'Categories'].map((item) => (
                <li key={item}>
                  <Button variant="link" className="h-auto p-0">
                    <Link href={`/${item.toLowerCase().replace(' ', '-')}`}>
                      {item}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2">
              {['Contact Us', 'Shipping Info', 'Returns'].map((item) => (
                <li key={item}>
                  <Button variant="link" className="h-auto p-0">
                    <Link href={`/${item.toLowerCase().replace(' ', '-')}`}>
                      {item}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>Email: support@pcbuilder.com</li>
              <li>Phone: (555) 123-4567</li>
              <li>Address: 123 PC Street, Tech City</li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PC Builder. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  )
}