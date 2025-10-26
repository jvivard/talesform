"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Stepper } from "@/components/talesform/stepper"
import { RandomizeStep } from "@/components/talesform/randomize-step"
import { CharacterNameStep } from "@/components/talesform/character-name-step"
import { GenderStep } from "@/components/talesform/gender-step"
import { CustomStep } from "@/components/talesform/custom-step"
import { SettingStep } from "@/components/talesform/setting-step"
import { SummaryStep } from "@/components/talesform/summary-step"
import { StoryResultStep } from "@/components/talesform/story-result-step"

const steps = [
  { key: "randomize", title: "Randomize" },
  { key: "name", title: "Character", subtitle: "Name" },
  { key: "gender", title: "Gender" },
  { key: "custom", title: "Custom", subtitle: "Elements" },
  { key: "setting", title: "Setting" },
  { key: "summary", title: "Summary" },
] as const

interface StoryFormData {
  characterName: string
  gender: string
  customElements: string
  setting: string
}

export default function TalesformPage() {
  const [current, setCurrent] = React.useState(1)
  const [formData, setFormData] = React.useState<StoryFormData>({
    characterName: "",
    gender: "",
    customElements: "",
    setting: "",
  })
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [storyResult, setStoryResult] = React.useState<any>(null)
  const [isRandomized, setIsRandomized] = React.useState(false)

  function next() {
    setCurrent((c) => Math.min(c + 1, steps.length))
  }

  function back() {
    setCurrent((c) => Math.max(1, c - 1))
  }

  function handleRandomizeChoice(choice: "surprise" | "custom") {
    setIsRandomized(choice === "surprise")
    if (choice === "surprise") {
      // Skip to summary for randomized stories
      setCurrent(6)
    } else {
      next()
    }
  }

  async function handleGenerateStory() {
    setIsGenerating(true)
    try {
      // Build the prompt from form data
      let prompt = ""
      
      if (isRandomized) {
        prompt = "Create a fun and educational children's story with interesting characters and an engaging plot."
      } else {
        const parts: string[] = []
        
        if (formData.characterName) {
          parts.push(`The main character is named ${formData.characterName}`)
        }
        
        if (formData.gender) {
          const genderText = formData.gender === "neutral" ? "gender-neutral" : formData.gender
          parts.push(`The character is a ${genderText}`)
        }
        
        if (formData.customElements) {
          parts.push(formData.customElements)
        }
        
        if (formData.setting) {
          parts.push(`The story takes place in ${formData.setting}`)
        }
        
        if (parts.length === 0) {
          prompt = "Create a fun and educational children's story with interesting characters and an engaging plot."
        } else {
          prompt = `Create a children's story with the following details: ${parts.join(". ")}.`
        }
      }

      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          pageCount: 5,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate story")
      }

      const result = await response.json()
      setStoryResult(result)
    } catch (error) {
      console.error("Error generating story:", error)
      alert("Failed to generate story. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  function handleRestart() {
    setCurrent(1)
    setFormData({
      characterName: "",
      gender: "",
      customElements: "",
      setting: "",
    })
    setStoryResult(null)
    setIsRandomized(false)
  }

  // If story is generated, show result
  if (storyResult) {
    return (
      <main className="min-h-[calc(100dvh-0px)]">
        <section className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
          <StoryResultStep story={storyResult} onRestart={handleRestart} />
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100dvh-0px)]">
      <section className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-accent text-balance">Welcome to TalesForm</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create your own storybook</p>
        </header>

        <Card className="rounded-xl sm:rounded-2xl border shadow-sm">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <Stepper steps={steps as any} current={current} onStepClick={setCurrent} className="mb-4 sm:mb-6" />

            {/* Step content */}
            {current === 1 && (
              <RandomizeStep onChoose={handleRandomizeChoice} />
            )}

            {current === 2 && (
              <CharacterNameStep
                value={formData.characterName}
                onChange={(value) => setFormData({ ...formData, characterName: value })}
                onNext={next}
                onBack={back}
              />
            )}

            {current === 3 && (
              <GenderStep
                value={formData.gender}
                onChange={(value) => setFormData({ ...formData, gender: value })}
                onNext={next}
                onBack={back}
              />
            )}

            {current === 4 && (
              <CustomStep
                value={formData.customElements}
                onChange={(value) => setFormData({ ...formData, customElements: value })}
                onNext={next}
                onBack={back}
              />
            )}

            {current === 5 && (
              <SettingStep
                value={formData.setting}
                onChange={(value) => setFormData({ ...formData, setting: value })}
                onNext={next}
                onBack={back}
              />
            )}

            {current === 6 && (
              <SummaryStep
                formData={formData}
                onBack={back}
                onGenerate={handleGenerateStory}
                isGenerating={isGenerating}
              />
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
