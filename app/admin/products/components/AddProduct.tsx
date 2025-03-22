'use client'

import { createProduct } from '../actions'

const componentTypes = ['CPU', 'GPU', 'MOTHERBOARD', 'RAM', 'STORAGE', 'PSU', 'CASE', 'COOLER', 'OTHER'] as const

export default function AddProduct() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Add New Product</h2>
      <form action={createProduct} className="space-y-4">
        <div>
          <label htmlFor="name" className="block mb-1">Product Name</label>
          <input type="text" id="name" name="name" required 
            className="w-full p-2 border rounded" />
        </div>

        <div>
          <label htmlFor="sku" className="block mb-1">SKU</label>
          <input type="text" id="sku" name="sku" required 
            className="w-full p-2 border rounded" />
        </div>

        <div>
          <label htmlFor="description" className="block mb-1">Description</label>
          <textarea id="description" name="description" required 
            className="w-full p-2 border rounded" rows={3} />
        </div>

        <div>
          <label htmlFor="price" className="block mb-1">Price</label>
          <input type="number" id="price" name="price" step="0.01" required 
            className="w-full p-2 border rounded" />
        </div>

        <div>
          <label htmlFor="stock" className="block mb-1">Stock</label>
          <input type="number" id="stock" name="stock" required 
            className="w-full p-2 border rounded" />
        </div>

        <div>
          <label htmlFor="brand" className="block mb-1">Brand</label>
          <input type="text" id="brand" name="brand" required 
            className="w-full p-2 border rounded" />
        </div>

        <div>
          <label htmlFor="componentType" className="block mb-1">Component Type</label>
          <select id="componentType" name="componentType" required 
            className="w-full p-2 border rounded">
            <option value="">Select a component type</option>
            {componentTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" 
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Add Product
        </button>
      </form>
    </div>
  )
}