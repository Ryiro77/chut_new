import { Command, CommandInput } from "cmdk"
import { Search, X } from "lucide-react"
import { useState } from "react"

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <Command className="rounded-lg border border-input shadow-sm">
      <div className="flex items-center w-full px-3">
        <Search className="h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          placeholder="Search products..."
          className="flex-1 h-9 px-3"
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        {searchQuery && (
          <X
            className="h-4 w-4 shrink-0 opacity-50 cursor-pointer hover:opacity-100"
            onClick={() => setSearchQuery('')}
          />
        )}
      </div>
    </Command>
  )
}