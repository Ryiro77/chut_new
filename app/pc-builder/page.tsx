'use client'

import { useState } from 'react'
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Container } from "@/components/ui/container"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

type Component = {
  type: string;
  name: string | null;
  price: number | null;
};

export default function PCBuilderPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Will be used when implementing component selection
  const [components, setComponents] = useState<Record<string, Component>>({
    cpu: { type: 'CPU', name: null, price: null },
    motherboard: { type: 'MOTHERBOARD', name: null, price: null },
    gpu: { type: 'GPU', name: null, price: null },
    ram: { type: 'RAM', name: null, price: null },
    storage: { type: 'STORAGE', name: null, price: null },
    psu: { type: 'PSU', name: null, price: null },
    case: { type: 'CASE', name: null, price: null },
    cooler: { type: 'COOLER', name: null, price: null },
  });

  const getTotalPrice = () => {
    return Object.values(components)
      .reduce((total, component) => total + (component.price || 0), 0);
  };

  // Placeholder function for component selection (to be implemented)
  const handleSelectComponent = (type: string) => {
    // Will implement product selection logic later
    console.log(`Selecting ${type}`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <Container className="py-8">
          <h1 className="text-2xl font-bold mb-6">Custom PC Builder</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
            {/* Component Selection Section */}
            <div className="space-y-4">
              {Object.entries(components).map(([key, component]) => (
                <Card key={key} className="border-2 hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{component.type}</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSelectComponent(key)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {component.name ? 'Change' : 'Add'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {component.name ? (
                      <div className="flex justify-between items-center">
                        <span>{component.name}</span>
                        <span className="font-semibold">
                          ₹{component.price?.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        No {component.type.toLowerCase()} selected
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Build Summary Section */}
            <div className="lg:sticky lg:top-4 space-y-4 h-fit">
              <Card>
                <CardHeader>
                  <CardTitle>Build Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Component List */}
                  <div className="space-y-2">
                    {Object.values(components).map((component) => (
                      <div key={component.type} className="flex justify-between text-sm">
                        <span>{component.type}</span>
                        <span>{component.price ? `₹${component.price.toLocaleString()}` : '-'}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-4">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>₹{getTotalPrice().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Compatibility Check */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Compatibility</h3>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>All components are compatible</span>
                      </div>
                      {/* Add more compatibility checks here later */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}