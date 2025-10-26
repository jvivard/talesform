"use client"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function CustomStep({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: string
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <div className="flex flex-col gap-6 py-8 sm:py-10 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-semibold">Custom Elements</h2>
        <p className="text-sm text-muted-foreground">
          Add any special themes or lessons you'd like in the story
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-elements">Custom Elements (Optional)</Label>
        <Textarea
          id="custom-elements"
          placeholder="E.g., 'a story about being a kind and helpful older sibling'"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-32 text-base resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Leave blank to let us create a story based on the character details
        </p>
      </div>

      <div className="flex justify-center gap-3 pt-4">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full px-8"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          size="lg"
          className="rounded-full px-8"
          onClick={onNext}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}

