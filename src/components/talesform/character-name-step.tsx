"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function CharacterNameStep({
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
        <h2 className="text-2xl sm:text-3xl font-semibold">Character Name</h2>
        <p className="text-sm text-muted-foreground">
          What should we call the main character?
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="character-name">Character Name (Optional)</Label>
        <Input
          id="character-name"
          type="text"
          placeholder="E.g., Alex, Emma, Max"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 text-base"
        />
        <p className="text-xs text-muted-foreground">
          Leave blank to let us choose a name for you
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

