"use client"

import { Button } from "@/components/ui/button"

export function RandomizeStep({
  onChoose,
}: {
  onChoose: (choice: "surprise" | "custom") => void
}) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-8 sm:py-10">
      {/* Replace question heading with a neutral prompt */}
      <h2 className="text-2xl sm:text-3xl font-semibold text-balance">How would you like to start?</h2>

      <div className="flex flex-col gap-4 w-full max-w-md">
        {/* Update primary button label */}
        <Button
          size="lg"
          className="rounded-full h-14 text-base sm:text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          onClick={() => onChoose("surprise")}
        >
          Surprise me, I’m ready!
        </Button>

        {/* Update secondary button label */}
        <Button
          size="lg"
          className="rounded-full h-14 text-base sm:text-lg bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm"
          onClick={() => onChoose("custom")}
        >
          I’ll make my own
        </Button>
      </div>
    </div>
  )
}
