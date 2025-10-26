"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PageCountStep({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: number
  onChange: (value: number) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <div className="flex flex-col gap-6 py-8 sm:py-10 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-semibold">Story Length</h2>
        <p className="text-sm text-muted-foreground">
          How many pages should your story have?
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="page-count">Number of Pages</Label>
        <Select value={value.toString()} onValueChange={(val) => onChange(parseInt(val))}>
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="Select page count" />
          </SelectTrigger>
          <SelectContent>
            {[3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
              <SelectItem key={count} value={count.toString()}>
                {count} page{count > 1 ? "s" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          More pages = longer story with more detail
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

