"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

interface StoryFormData {
  characterName: string
  gender: string
  customElements: string
  setting: string
}

export function SummaryStep({
  formData,
  onBack,
  onGenerate,
  isGenerating,
}: {
  formData: StoryFormData
  onBack: () => void
  onGenerate: () => void
  isGenerating: boolean
}) {
  const hasAnyData =
    formData.characterName ||
    formData.gender ||
    formData.customElements ||
    formData.setting

  return (
    <div className="flex flex-col gap-6 py-8 sm:py-10 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-semibold">Story Summary</h2>
        <p className="text-sm text-muted-foreground">
          Review your story preferences before generating
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">
              Character Name:
            </span>
            <span className="text-base">
              {formData.characterName || <em className="text-muted-foreground">Not specified</em>}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">
              Gender:
            </span>
            <span className="text-base capitalize">
              {formData.gender || <em className="text-muted-foreground">Not specified</em>}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">
              Custom Elements:
            </span>
            <span className="text-base">
              {formData.customElements || <em className="text-muted-foreground">Not specified</em>}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">
              Setting:
            </span>
            <span className="text-base">
              {formData.setting || <em className="text-muted-foreground">Not specified</em>}
            </span>
          </div>
        </div>

        {!hasAnyData && (
          <p className="text-sm text-muted-foreground italic pt-2">
            You haven't specified any preferences. We'll create a surprise story for you!
          </p>
        )}
      </Card>

      <div className="flex justify-center gap-3 pt-4">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full px-8"
          onClick={onBack}
          disabled={isGenerating}
        >
          Back
        </Button>
        <Button
          size="lg"
          className="rounded-full px-8 min-w-[180px]"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Spinner className="mr-2" />
              Generating...
            </>
          ) : (
            "Generate Story"
          )}
        </Button>
      </div>
    </div>
  )
}

