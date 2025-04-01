'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Container } from "@/components/ui/container"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Share2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Product, Component } from '@/lib/types'
import { addToCart } from '@/lib/api-client'
import { SelectComponentDialog } from './_components/SelectComponentDialog'

const BUILD_STORAGE_KEY = 'pc_builder_current_build';

const componentTypes = {
  cpu: 'CPU',
  motherboard: 'MOTHERBOARD',
  ram: 'RAM',
  gpu: 'GPU',
  storage: 'STORAGE',
  psu: 'PSU',
  case: 'CASE',
  cooler: 'COOLER'
} as const

type ComponentTypes = typeof componentTypes
type ComponentsMap = Record<keyof ComponentTypes, Component>

interface CompatibilityResult {
  compatible: boolean;
  messages: string[];
}

const initialComponents: ComponentsMap = {
  cpu: { type: 'CPU', id: null, name: null, price: null, brand: null },
  motherboard: { type: 'MOTHERBOARD', id: null, name: null, price: null, brand: null },
  ram: { type: 'RAM', id: null, name: null, price: null, brand: null },
  gpu: { type: 'GPU', id: null, name: null, price: null, brand: null },
  storage: { type: 'STORAGE', id: null, name: null, price: null, brand: null },
  psu: { type: 'PSU', id: null, name: null, price: null, brand: null },
  case: { type: 'CASE', id: null, name: null, price: null, brand: null },
  cooler: { type: 'COOLER', id: null, name: null, price: null, brand: null }
};

export default function PCBuilderPage() {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<keyof typeof componentTypes | null>(null)
  const [loading, setLoading] = useState(false)
  const [components, setComponents] = useState<ComponentsMap>(initialComponents)
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult>({ compatible: true, messages: [] })

  // Load build from local storage on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(window.location.search);
    const buildId = searchParams.get('id');
    
    if (buildId) {
      // If there's a build ID in the URL, fetch that build
      const fetchBuild = async () => {
        try {
          const response = await fetch(`/api/builds?id=${buildId}`);
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);

          setComponents(data.components as ComponentsMap);
          // Save the fetched build to local storage
          localStorage.setItem(BUILD_STORAGE_KEY, JSON.stringify(data.components));
          router.replace('/pc-builder');
        } catch (error) {
          console.error('Load build error:', error);
          toast.error('Failed to load shared build');
          // Try loading from local storage as fallback
          loadFromLocalStorage();
        }
      };
      fetchBuild();
    } else {
      // If no build ID, try loading from local storage
      loadFromLocalStorage();
    }
  }, [router]);

  // Save to local storage whenever components change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(BUILD_STORAGE_KEY, JSON.stringify(components));
  }, [components]);

  const loadFromLocalStorage = () => {
    try {
      const savedBuild = localStorage.getItem(BUILD_STORAGE_KEY);
      if (savedBuild) {
        const parsedBuild = JSON.parse(savedBuild);
        setComponents(parsedBuild);
      }
    } catch (error) {
      console.error('Error loading build from localStorage:', error);
    }
  };

  const handleSelectComponent = (type: keyof typeof componentTypes) => {
    setSelectedType(type)
    setDialogOpen(true)
  }

  const handleComponentSelect = (product: Product) => {
    if (!selectedType) return
    
    setComponents(prev => ({
      ...prev,
      [selectedType]: {
        type: componentTypes[selectedType],
        id: product.id,
        name: product.name,
        price: product.isOnSale && product.discountedPrice ? product.discountedPrice : product.regularPrice,
        brand: product.brand,
        image: product.images?.find(img => img.isMain)?.url || 
               `/uploads/${product.images?.find(img => img.isMain)?.filePath || 
               product.images?.[0]?.filePath}` ||
               '/no-image.png',
        specs: product.specs,
        isOnSale: product.isOnSale
      }
    }))
  }

  const handleRemoveComponent = (type: keyof typeof componentTypes) => {
    setComponents(prev => ({
      ...prev,
      [type]: { type: componentTypes[type], id: null, name: null, price: null, brand: null }
    }))
  }

  const handleShareBuild = async () => {
    try {
      // Only create share link if at least one component is selected
      if (Object.values(components).every(comp => !comp.id)) {
        toast.error('Please select at least one component to share');
        return;
      }

      const response = await fetch('/api/builds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ components }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      await navigator.clipboard.writeText(data.buildUrl);
      toast.success('Build link copied to clipboard!');
    } catch (error) {
      console.error('Share build error:', error);
      toast.error('Failed to create share link');
    }
  }

  const checkCompatibility = useCallback((): CompatibilityResult => {
    const messages: string[] = [];
    const cpu = components.cpu;
    const motherboard = components.motherboard;
    const psu = components.psu;
    const pcCase = components.case;
    const ram = components.ram;

    // Check CPU Socket Compatibility
    if (cpu.id && motherboard.id) {
      const cpuSocket = cpu.specs?.find(spec => spec.name.toLowerCase() === 'socket')?.value;
      const mbSocket = motherboard.specs?.find(spec => spec.name.toLowerCase() === 'socket')?.value;
      
      if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
        messages.push(`CPU socket (${cpuSocket}) does not match motherboard socket (${mbSocket})`);
      }
    }

    // Check RAM Type Compatibility
    if (ram.id && motherboard.id) {
      const ramType = ram.specs?.find(spec => spec.name.toLowerCase() === 'type')?.value; // Assuming RAM type spec is named 'Type'
      const mbRamType = motherboard.specs?.find(spec => spec.name.toLowerCase() === 'memory type')?.value; // Assuming MB RAM type spec is named 'Memory Type'
      
      if (ramType && mbRamType && !mbRamType.toLowerCase().includes(ramType.toLowerCase())) { // Check if MB supports the RAM type (case-insensitive)
        messages.push(`RAM type (${ramType}) is not compatible with motherboard supported types (${mbRamType})`);
      }
    }

    // Check PSU Wattage
    if (psu.id) {
      const psuWattage = parseInt(psu.specs?.find(spec => spec.name.toLowerCase() === 'wattage')?.value?.replace('W', '') || '0');
      // Estimate required wattage (This is a very rough estimate)
      const cpuTdp = parseInt(cpu.specs?.find(spec => spec.name.toLowerCase() === 'tdp')?.value?.replace('W', '') || '65');
      const gpuTdp = parseInt(components.gpu.specs?.find(spec => spec.name.toLowerCase() === 'tdp')?.value?.replace('W', '') || '150'); // GPU estimate if not selected
      const estimatedWattage = cpuTdp + gpuTdp + 100; // Base system power

      if (psuWattage > 0 && psuWattage < estimatedWattage) {
        messages.push(`PSU wattage (${psuWattage}W) may be insufficient for estimated load (~${estimatedWattage}W)`);
      }
    }

    // Check Case Compatibility (Motherboard Form Factor)
    if (motherboard.id && pcCase.id) {
      const mbFormFactor = motherboard.specs?.find(spec => spec.name.toLowerCase() === 'form factor')?.value;
      const caseFormFactorSupport = pcCase.specs?.find(spec => spec.name.toLowerCase() === 'motherboard support')?.value; // Assuming case spec is 'Motherboard Support'

      if (mbFormFactor && caseFormFactorSupport && !caseFormFactorSupport.toLowerCase().includes(mbFormFactor.toLowerCase())) {
        messages.push(`Case (${pcCase.name || 'Selected Case'}) may not support ${mbFormFactor} motherboards.`);
      }
    }
    
    // Check Case Compatibility (GPU Length) - Example
    if (components.gpu.id && pcCase.id) {
        const gpuLength = parseInt(components.gpu.specs?.find(spec => spec.name.toLowerCase() === 'length')?.value?.replace('mm', '') || '0');
        const maxGpuLength = parseInt(pcCase.specs?.find(spec => spec.name.toLowerCase() === 'max gpu length')?.value?.replace('mm', '') || '0');

        if (gpuLength > 0 && maxGpuLength > 0 && gpuLength > maxGpuLength) {
            messages.push(`GPU (${components.gpu.name || 'Selected GPU'}) length (${gpuLength}mm) exceeds case maximum (${maxGpuLength}mm).`);
        }
    }

    return { compatible: messages.length === 0, messages };
  }, [components]); // Add components as dependency

  const handleAddToCart = async () => {
    setLoading(true)
    try {
      const currentCompatibility = checkCompatibility();
      setCompatibilityResult(currentCompatibility);

      if (!currentCompatibility.compatible) {
        toast.error("Please resolve compatibility issues before adding to cart");
        return;
      }

      const items = Object.values(components)
        .filter(comp => comp.id)
        .map(comp => ({
          id: comp.id!,
          name: comp.name!,
          brand: comp.brand!,
          regularPrice: comp.price!, 
          discountedPrice: comp.isOnSale && comp.price ? comp.price : undefined,  // Ensure it's undefined, not null
          isOnSale: Boolean(comp.isOnSale)
        }))

      if (items.length === 0) {
        toast.error('Please select at least one component')
        return
      }

      await addToCart(items, 1, true) // Add isCustomBuild flag
      toast.success('Components added to cart')
      router.push('/cart')
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error('Failed to add components to cart');
    } finally {
      setLoading(false)
    }
  }

  // Calculate total price
  const totalPrice = Object.values(components).reduce((sum, component) => {
    return sum + (component.price || 0);
  }, 0);

  // Update compatibility whenever components change
  useEffect(() => {
    setCompatibilityResult(checkCompatibility());
  }, [components, checkCompatibility]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <Container className="py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">PC Builder</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Components List - Takes 2/3 width on large screens */}
            <div className="lg:col-span-2 space-y-4">
              {(Object.entries(components) as [keyof typeof componentTypes, Component][]).map(([type, component]) => (
                <Card key={type}>
                  <CardHeader className="py-4">
                    <CardTitle className="text-lg">{componentTypes[type]}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {component.id ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <Image
                            src={component.image ? 
                              component.image.startsWith('/') ? component.image : `/uploads/${component.image}` 
                              : '/no-image.png'
                            }
                            alt={component.name || ''}
                            fill
                            className="object-contain rounded-md"
                            sizes="80px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{component.name}</h4>
                          <p className="text-sm text-muted-foreground">{component.brand}</p>
                          <p className="font-medium mt-1">₹{component.price?.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0 flex-shrink-0">
                          <Button size="sm" onClick={() => handleSelectComponent(type)}>
                            Change
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRemoveComponent(type)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" onClick={() => handleSelectComponent(type)} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Select {componentTypes[type]}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Build Summary - Takes 1/3 width on large screens */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Build Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Compatibility</h4>
                    {compatibilityResult.compatible ? (
                      <Badge variant="success">Compatible</Badge>
                    ) : (
                      <div className="space-y-1">
                        <Badge variant="destructive">Incompatible</Badge>
                        <ul className="list-disc list-inside text-sm text-destructive">
                          {compatibilityResult.messages.map((msg, index) => (
                            <li key={index}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">Estimated Total</h4>
                    <p className="text-2xl font-bold">₹{totalPrice.toLocaleString()}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button onClick={handleAddToCart} disabled={loading || Object.values(components).every(c => !c.id)} className="w-full">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Add Build to Cart
                  </Button>
                  <Button variant="outline" onClick={handleShareBuild} className="w-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Build
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </Container>
      </main>

      <SelectComponentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        componentType={selectedType ? componentTypes[selectedType] : undefined}
        onSelect={handleComponentSelect}
      />

      <Footer />
    </div>
  )
}

// Note: Ensure you have a 'success' variant defined in your components/ui/badge.tsx
// Example for badge.tsx:
// const badgeVariants = cva(
//   "...",
//   variants: {
//     variant: {
//       default: "...",
//       secondary: "...",
//       destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
//       success: "border-transparent bg-green-600 text-white shadow hover:bg-green-600/80", // Added success variant
//       outline: "text-foreground",
//     },
//   },
//   ...
// )