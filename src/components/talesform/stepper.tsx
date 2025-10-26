"use client"
import { cn } from "@/lib/utils"

type Step = {
  key: string
  title: string
  subtitle?: string
}

export function Stepper({
  steps,
  current,
  onStepClick,
  className,
}: {
  steps: Step[]
  current: number // 1-based index
  onStepClick?: (index: number) => void
  className?: string
}) {
  return (
    <nav aria-label="Progress" className={cn("w-full", className)}>
      <ol className="flex items-center gap-2 sm:gap-4">
        {steps.map((s, i) => {
          const index = i + 1
          const isActive = index === current
          const isComplete = index < current
          const circleClass = cn(
            "size-8 sm:size-9 rounded-full border flex items-center justify-center text-sm font-medium",
            "shadow-sm",
            isComplete && "bg-primary text-primary-foreground border-primary",
            isActive && "bg-primary/15 text-foreground border-border ring-2 ring-primary",
            !isActive && !isComplete && "bg-muted text-muted-foreground border-border",
          )
          const labelClass = cn("text-[11px] sm:text-xs text-muted-foreground text-center leading-tight select-none")

          return (
            <li key={s.key} className="flex items-center w-full">
              <button
                type="button"
                className="group flex items-center gap-2"
                aria-current={isActive ? "step" : undefined}
                aria-label={`${index}. ${s.title}${s.subtitle ? `, ${s.subtitle}` : ""}`}
                onClick={onStepClick ? () => onStepClick(index) : undefined}
              >
                <div className={circleClass}>{index}</div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className={labelClass}>{s.title}</span>
                  {s.subtitle ? <span className={labelClass}>{s.subtitle}</span> : null}
                </div>
              </button>

              {index !== steps.length && <div className="mx-2 sm:mx-4 flex-1 h-px bg-border" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
