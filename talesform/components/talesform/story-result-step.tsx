"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface StoryPage {
  pageNumber: number
  title: string
  content: string
  imageUrl?: string
}

interface Story {
  title: string
  coverImageUrl?: string
  pages: StoryPage[]
  genre: string
  targetAge: string
}

export function StoryResultStep({
  story,
  onRestart,
}: {
  story: Story
  onRestart: () => void
}) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-accent text-balance">
          {story.title}
        </h1>
        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <span className="capitalize">{story.genre}</span>
          <span>•</span>
          <span>Ages {story.targetAge}</span>
        </div>
      </div>

      {/* Cover Image */}
      {story.coverImageUrl && (
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <Card className="overflow-hidden">
              <img
                src={story.coverImageUrl}
                alt={`Cover for ${story.title}`}
                className="w-full h-auto"
              />
            </Card>
          </div>
        </div>
      )}

      {/* Story Pages */}
      <div className="space-y-6">
        {story.pages.map((page) => (
          <Card key={page.pageNumber} className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {page.pageNumber}
                  </span>
                  <h2 className="text-xl font-semibold">{page.title}</h2>
                </div>
                <p className="text-base leading-relaxed">{page.content}</p>
              </div>
            </div>

            {/* Page Image */}
            {page.imageUrl && (
              <div className="flex justify-center pt-2">
                <img
                  src={page.imageUrl}
                  alt={`Illustration for ${page.title}`}
                  className="w-full max-w-lg rounded-lg border"
                />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          className="rounded-full px-8"
          onClick={onRestart}
        >
          Create Another Story
        </Button>
      </div>
    </div>
  )
}

