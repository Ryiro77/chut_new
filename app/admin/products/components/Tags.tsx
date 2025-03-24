'use client'

import { useEffect, useState } from 'react'
import { getTags, createTag, deleteTag } from '../actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, X } from 'lucide-react'

type Tag = {
  id: string
  name: string
}

type TagsProps = {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
}

export default function Tags({ selectedTags, onTagsChange }: TagsProps) {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [tagInput, setTagInput] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async (search?: string) => {
    try {
      setLoading(true)
      const tags = await getTags(search)
      setAllTags(tags)
    } catch (error) {
      setError('Failed to load tags')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = async () => {
    if (!tagInput.trim()) return

    try {
      const newTag = await createTag(tagInput.trim())
      setAllTags([...allTags, newTag])
      setTagInput('')
      
      // If the newly created tag isn't already selected, add it to selection
      if (!selectedTags.includes(newTag.name)) {
        onTagsChange([...selectedTags, newTag.name])
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Failed to create tag')
      }
      console.error(error)
    }
  }

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    try {
      await deleteTag(tagId)
      setAllTags(allTags.filter(tag => tag.id !== tagId))
      
      // Remove from selected tags if it was selected
      if (selectedTags.includes(tagName)) {
        onTagsChange(selectedTags.filter(t => t !== tagName))
      }
    } catch (error) {
      setError('Failed to delete tag')
      console.error(error)
    }
  }

  const handleTagSelection = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter(t => t !== tagName))
    } else {
      onTagsChange([...selectedTags, tagName])
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchInput(value)
    loadTags(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search tags..."
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="New tag..."
            className="w-32"
          />
          <Button
            type="button"
            onClick={handleAddTag}
            size="icon"
            variant="secondary"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-2 bg-destructive/10 text-destructive rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {loading ? (
          <div className="text-muted-foreground text-sm">Loading tags...</div>
        ) : allTags.length === 0 ? (
          <div className="text-muted-foreground text-sm">No tags found</div>
        ) : (
          allTags.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTags.includes(tag.name) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => handleTagSelection(tag.name)}
            >
              {tag.name}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteTag(tag.id, tag.name)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))
        )}
      </div>
    </div>
  )
}