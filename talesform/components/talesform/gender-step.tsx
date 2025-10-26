"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function GenderStep({
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
        <h2 className="text-2xl sm:text-3xl font-semibold">Gender</h2>
        <p className="text-sm text-muted-foreground">
          Select the character's gender (optional)
        </p>
      </div>

      <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
        <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/10 cursor-pointer">
          <RadioGroupItem value="boy" id="boy" />
          <Label htmlFor="boy" className="flex-1 cursor-pointer text-base">
            Boy
          </Label>
        </div>
        <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/10 cursor-pointer">
          <RadioGroupItem value="girl" id="girl" />
          <Label htmlFor="girl" className="flex-1 cursor-pointer text-base">
            Girl
          </Label>
        </div>
        <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/10 cursor-pointer">
          <RadioGroupItem value="neutral" id="neutral" />
          <Label htmlFor="neutral" className="flex-1 cursor-pointer text-base">
            Gender Neutral
          </Label>
        </div>
        <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/10 cursor-pointer">
          <RadioGroupItem value="" id="any" />
          <Label htmlFor="any" className="flex-1 cursor-pointer text-base">
            Any / Skip
          </Label>
        </div>
      </RadioGroup>

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

