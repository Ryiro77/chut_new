'use client'

import { useEffect, useState } from 'react'
import { getTags, createTag, deleteTag } from '../actions'

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
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search tags..."
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="New tag..."
            className="p-2 border rounded"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {loading ? (
          <div className="text-gray-500">Loading tags...</div>
        ) : allTags.length === 0 ? (
          <div className="text-gray-500">No tags found</div>
        ) : (
          allTags.map((tag) => (
            <div
              key={tag.id}
              className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer ${
                selectedTags.includes(tag.name)
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => handleTagSelection(tag.name)}
            >
              <span>{tag.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteTag(tag.id, tag.name)
                }}
                className="ml-1 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}