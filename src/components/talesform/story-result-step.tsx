"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Play, Pause } from "lucide-react"

export interface StoryPage {
  pageNumber: number
  title: string
  content: string
  imageUrl?: string
}

export interface Story {
  title: string
  coverImageUrl?: string
  pages: StoryPage[]
  genre: string
  targetAge: string
  coloringPageImageUrl?: string
}

export function StoryResultStep({
  story,
  onRestart,
}: {
  story: Story
  onRestart: () => void
}) {
  const [isDownloading, setIsDownloading] = React.useState(false)
  const [audioCache, setAudioCache] = React.useState<Record<number, string>>({})
  const [isGeneratingAudio, setIsGeneratingAudio] = React.useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = React.useState<number | null>(null)
  const audioRefs = React.useRef<Record<number, HTMLAudioElement>>({})
  const [hasRequestedAudio, setHasRequestedAudio] = React.useState(false)

  // Generate all audio when user first clicks play
  async function generateAllAudio() {
    if (hasRequestedAudio) return // Already generated or in progress
    
    setHasRequestedAudio(true)
    setIsGeneratingAudio(true)
    
    try {
      const response = await fetch("/api/narrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pages: story.pages.map((p) => ({
            pageNumber: p.pageNumber,
            content: p.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate narration")
      }

      const { audioResults } = await response.json()
      
      // Cache all audio URLs
      const newCache: Record<number, string> = {}
      audioResults.forEach((result: { pageNumber: number; audioUrl: string }) => {
        if (result.audioUrl) {
          newCache[result.pageNumber] = result.audioUrl
        }
      })
      
      setAudioCache(newCache)
    } catch (error) {
      console.error("Error generating audio:", error)
      alert("Failed to generate narration. Please try again.")
      setHasRequestedAudio(false) // Allow retry
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  // Handle play/pause for a specific page
  async function handlePlayPause(pageNumber: number) {
    // If this is the first play attempt, generate all audio
    if (!hasRequestedAudio && !isGeneratingAudio) {
      await generateAllAudio()
    }

    // If audio is generating, wait
    if (isGeneratingAudio) return

    // If this page is currently playing, pause it
    if (currentlyPlaying === pageNumber) {
      const audio = audioRefs.current[pageNumber]
      if (audio) {
        audio.pause()
        setCurrentlyPlaying(null)
      }
      return
    }

    // Stop any currently playing audio
    if (currentlyPlaying !== null) {
      const currentAudio = audioRefs.current[currentlyPlaying]
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
      }
    }

    // Play the selected page
    const audioUrl = audioCache[pageNumber]
    if (audioUrl) {
      if (!audioRefs.current[pageNumber]) {
        const audio = new Audio(audioUrl)
        audio.onended = () => setCurrentlyPlaying(null)
        audioRefs.current[pageNumber] = audio
      }
      
      const audio = audioRefs.current[pageNumber]
      audio.currentTime = 0
      audio.play()
      setCurrentlyPlaying(pageNumber)
    }
  }

  // Cleanup audio on unmount
  React.useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause()
        audio.src = ""
      })
    }
  }, [])

  async function handleDownloadPdf() {
    setIsDownloading(true)
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(story),
      })

      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${story.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error("Error downloading PDF:", error)
      alert("Failed to download PDF. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

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
                  
                  {/* Play/Pause Button */}
                  <button
                    onClick={() => handlePlayPause(page.pageNumber)}
                    disabled={isGeneratingAudio}
                    className="ml-2 inline-flex items-center justify-center size-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      isGeneratingAudio
                        ? "Generating audio..."
                        : currentlyPlaying === page.pageNumber
                        ? "Pause narration"
                        : "Play narration"
                    }
                  >
                    {isGeneratingAudio ? (
                      <Spinner className="size-4" />
                    ) : currentlyPlaying === page.pageNumber ? (
                      <Pause className="size-4" />
                    ) : (
                      <Play className="size-4 ml-0.5" />
                    )}
                  </button>
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

      {/* Coloring Page Section */}
      {story.coloringPageImageUrl && (
        <div className="space-y-4 pt-6">
          <h2 className="text-2xl font-semibold text-center">Coloring Exercise</h2>
          <Card className="p-4">
            <img
              src={story.coloringPageImageUrl}
              alt="Coloring page exercise"
              className="w-full max-w-lg mx-auto rounded-lg border"
            />
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center pt-4 gap-4">
        <Button
          size="lg"
          variant="outline"
          className="rounded-full px-8"
          onClick={handleDownloadPdf}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <Spinner className="mr-2" />
              Downloading...
            </>
          ) : (
            "Download PDF"
          )}
        </Button>
        <Button
          size="lg"
          className="rounded-full px-8"
          onClick={onRestart}
          disabled={isDownloading}
        >
          Create Another Story
        </Button>
      </div>
    </div>
  )
}

