import Link from "next/link"
import { User, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { SearchBar } from "@/components/SearchBar"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import Image from "next/image"

const categories = [
  { name: "CPUs", href: "/products?category=cpu", type: "CPU" },
  { name: "GPUs", href: "/products?category=gpu", type: "GPU" },
  { name: "Motherboards", href: "/products?category=motherboard", type: "MOTHERBOARD" },
  { name: "RAM", href: "/products?category=ram", type: "RAM" },
  { name: "Storage", href: "/products?category=storage", type: "STORAGE" },
  { name: "Power Supplies", href: "/products?category=psu", type: "PSU" },
  { name: "Cases", href: "/products?category=case", type: "CASE" },
  { name: "Coolers", href: "/products?category=cooler", type: "COOLER" },
  { name: "Other", href: "/products?category=other", type: "OTHER" },
]

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Section */}
      <Container>
        <div className="flex h-16 items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/computerhutlogo.png"
              alt="PC Builder Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold">PC Builder</span>
          </Link>
          
          <div className="flex-1 flex justify-center">
            <SearchBar />
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild>
              <Link href="/auth">
                <User className="h-5 w-5" />
                <span className="sr-only">Account</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Cart</span>
              </Link>
            </Button>
          </div>
        </div>
      </Container>

      {/* Bottom Section - Navigation */}
      <Container>
        <div className="flex h-12 items-center">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Products</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2">
                    {categories.map((category) => (
                      <li key={category.type}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={category.href}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">{category.name}</div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/pc-builder" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Build PC
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/about" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    About
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/support" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Support
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </Container>
    </header>
  )
}