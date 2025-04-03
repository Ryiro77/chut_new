'use client'

import { useRouter, usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { User, ShoppingCart, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { SearchBar } from "@/components/SearchBar"
import Link from "next/link"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"

const categories = [
  { name: "CPUs", href: "/products?category=cpu", type: "CPU" },
  { name: "GPUs", href: "/products?category=gpu", type: "GPU" },
  { name: "Motherboards", href: "/products?category=motherboard", type: "MOTHERBOARD" },
  { name: "RAM", href: "/products?category=ram", type: "RAM" },
  { name: "Storage", href: "/products?category=storage", type: "STORAGE" },
  { name: "PSUs", href: "/products?category=psu", type: "PSU" },
  { name: "Cases", href: "/products?category=case", type: "CASE" },
  { name: "Coolers", href: "/products?category=cooler", type: "COOLER" },
  { name: "Other", href: "/products?category=other", type: "OTHER" }
]

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const handleCategoryClick = (href: string, e: React.MouseEvent) => {
    if (pathname === '/products') {
      e.preventDefault()
      router.push(href, { scroll: false })
    }
  }

  const handleSignOut = async () => {
    const isUserPage = pathname.startsWith('/account') || pathname.startsWith('/orders')
    
    await signOut({ 
      redirect: isUserPage,
      callbackUrl: isUserPage ? '/' : pathname
    })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Section - Logo, Search, User Controls */}
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex gap-6 md:gap-10 flex-1">
            <Link href="/" className="flex items-center gap-2 min-w-fit">
              <Image src="/computerhutlogo.png" alt="Computer Hut Logo" width={40} height={40} className="w-10 h-10" />
              <span className="inline-block font-bold text-lg whitespace-nowrap">Computer Hut</span>
            </Link>

            <div className="flex-1 max-w-3xl">
              <SearchBar />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {status === 'authenticated' && session ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {session.user.name && (
                        <span className="hidden md:inline-block text-sm">
                          {session.user.name}
                        </span>
                      )}
                      <span className="sr-only">Account menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/account">My Account</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders">My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/auth">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Sign in</span>
                </Link>
              </Button>
            )}

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
                            onClick={(e) => handleCategoryClick(category.href, e)}
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
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </Container>
    </header>
  )
}