import { createVertex } from "@ai-sdk/google-vertex";
import {
  generateObject,
  generateText,
  experimental_generateImage as generateImage,
  NoImageGeneratedError,
} from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

// Define the schema for character descriptions
const CharacterSchema = z.object({
  name: z.string(),
  description: z.string(),
  appearance: z.string(),
});

// Define the schema for a story page
const StoryPageSchema = z.object({
  pageNumber: z.number(),
  title: z.string(),
  content: z.string(),
  characters: z.array(z.string()),
  setting: z.string(),
  mood: z.string(),
});

// Define the schema for the complete story
const StorySchema = z.object({
  title: z.string(),
  pages: z.array(StoryPageSchema),
  characters: z.array(CharacterSchema),
  genre: z.string(),
  targetAge: z.string(),
});

interface StoryWithImages extends z.infer<typeof StorySchema> {
  pages: Array<z.infer<typeof StoryPageSchema> & { imageUrl?: string }>;
  characters: z.infer<typeof CharacterSchema>[];
  coverImageUrl?: string;
  coloringPageImageUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      pageCount = 5,
      characterName,
      gender,
      customElements,
      setting 
    } = body;

    const google = createVertex({
      location: process.env.GCP_LOCATION || "us-central1",
      project: process.env.GCP_PROJECT!,
    });

    // Build prompt from structured data if provided, otherwise use direct prompt
    let finalPrompt = prompt;
    
    if (!prompt && (characterName || gender || customElements || setting)) {
      const parts: string[] = [];
      
      if (characterName) {
        parts.push(`The main character is named ${characterName}`);
      }
      
      if (gender) {
        const genderText = gender === "neutral" ? "gender-neutral" : gender;
        parts.push(`The character is a ${genderText}`);
      }
      
      if (customElements) {
        parts.push(customElements);
      }
      
      if (setting) {
        parts.push(`The story takes place in ${setting}`);
      }
      
      finalPrompt = parts.length > 0 
        ? `Create a children's story with the following details: ${parts.join(". ")}.`
        : "Create a fun and educational children's story with interesting characters and an engaging plot.";
    }

    if (!finalPrompt) {
      return NextResponse.json(
        { error: "Prompt or story details are required" },
        { status: 400 }
      );
    }

    // Unified visual theme to keep all images consistent and avoid buggy outputs
    const IMAGE_STYLE_DIRECTIVE = `
      Consistent children's book watercolor illustration theme with soft pastel colors and gentle lighting; 
      hand-painted feel with clean outlines; cute rounded proportions; consistent character designs across all pages 
      (same clothes, colors, hair, and species); single cohesive art style throughout. STRICTLY NO TEXT, NO LETTERS, 
      NO WORDS, NO WRITING, NO SIGNS, NO CAPTIONS anywhere in the image. Avoid text, letters, numbers, symbols, 
      watermarks, signatures, frames, borders, photorealism, 3D rendering, pixelation, glitches, artifacts, 
      distorted faces, extra fingers, extra limbs, or deformed anatomy.
    `
      .replace(/\s+/g, " ")
      .trim();

    // Normalize and constrain prompts sent to Imagen to avoid malformed requests
    function sanitizeImagenPrompt(text: string): string {
      if (!text) return "";
      // Collapse whitespace, strip control/non-printable chars, trim, and cap length
      const collapsed = String(text).replace(/\s+/g, " ").trim();
      const asciiSafe = collapsed.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
      // Imagen can fail on excessively long prompts; keep headroom for appended style directive
      return asciiSafe.slice(0, 1800);
    }

    function buildImagenPrompt(base: string): string {
      const normalized = sanitizeImagenPrompt(base);
      const final = `${normalized}. Visual theme: ${IMAGE_STYLE_DIRECTIVE}`;
      return final.slice(0, 2000);
    }

    // Local placeholder (never fails)
    const makePlaceholderImage = (title: string) => {
      const safeTitle = (title || "Story").slice(0, 40);
      const svg = `<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#a8e6cf'/>
      <stop offset='50%' stop-color='#7fcdcd'/>
      <stop offset='100%' stop-color='#81c784'/>
    </linearGradient>
  </defs>
  <rect width='1024' height='1024' fill='url(#g)'/>
  <g fill='#000000' opacity='0.15'>
    <circle cx='200' cy='200' r='60'/>
    <circle cx='250' cy='260' r='20'/>
    <circle cx='160' cy='260' r='20'/>
  </g>
  <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='Georgia, serif' font-size='64' fill='rgba(0,0,0,0.65)'>${safeTitle}</text>
  <text x='50%' y='60%' dominant-baseline='middle' text-anchor='middle' font-family='Georgia, serif' font-size='36' fill='rgba(0,0,0,0.55)'>Illustration placeholder</text>
 </svg>`;
      return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    };

    // Step 1: Generate the story structure using Gemini 2.5 Flash
    const storyResult = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: StorySchema,
      prompt: `Create a children's storybook based on this prompt: "${finalPrompt}". 
      The story should have exactly ${pageCount} pages, with each page having:
      - A clear title
      - 2-3 sentences of engaging content appropriate for children
      - Characters involved in that scene
      - Setting/location description
      - Mood/atmosphere
      
      ALSO provide detailed character descriptions including:
      - Character name
      - Brief description of their role/personality
      - Detailed physical appearance (clothing style, colors, hair, facial features, body type, species if non-human)
      
      This is CRITICAL for visual consistency - be very specific about character appearance details like:
      - Exact clothing items and colors (e.g., "red striped t-shirt, blue jeans")
      - Hair color, style, and length
      - Eye color and facial features
      - Height and build
      - Any distinguishing features
      
      Make it educational, fun, and age-appropriate for children aged 4-8 years.`,
    });

    const story = storyResult.object as StoryWithImages;

    // Step 2: Generate cover image
    let coverImageUrl: string | undefined;
    try {
      const coverPromptResult = await generateText({
        model: google("gemini-2.5-flash"),
        prompt: `Create a detailed cover image prompt for this children's storybook. Use a single, consistent visual theme for the entire book as specified below.
        
        Title: ${story.title}
        Genre: ${story.genre}
        Main Characters: ${story.characters
          .map((char) => `${char.name} (${char.appearance})`)
          .join(", ")}
        
         Generate a prompt for a beautiful, colorful children's book cover illustration.
         Enforce this exact visual theme (do not deviate across pages): ${IMAGE_STYLE_DIRECTIVE}
        Include:
        - Main characters in a welcoming scene
        - Warm, inviting colors
        - Child-friendly artistic style with consistent character appearance
        - Storybook cover composition matching the theme
        
        IMPORTANT: Create a pure illustration with NO TEXT, NO LETTERS, NO WORDS, NO WRITING of any kind.
        
        Keep it concise (max 80 words).`,
      });

      const coverEnhancedPrompt = buildImagenPrompt(coverPromptResult.text);
      // Helpful diagnostics for malformed request debugging
      console.info("[Cover Imagen Request]", {
        model: "imagen-3.0-generate-002",
        aspectRatio: "1:1",
        promptLength: coverEnhancedPrompt.length,
        promptPreview: coverEnhancedPrompt.slice(0, 240),
      });

      const coverImageResult = await generateImage({
        model: google.image("imagen-3.0-generate-002"),
        prompt: coverEnhancedPrompt,
        aspectRatio: "1:1",
      });

      coverImageUrl = `data:image/png;base64,${Buffer.from(
        coverImageResult.image.uint8Array
      ).toString("base64")}`;
    } catch (error) {
      if ((NoImageGeneratedError as any)?.isInstance?.(error)) {
        console.error("Cover NoImageGeneratedError cause:", (error as any).cause);
        console.error("Cover NoImageGeneratedError responses:", (error as any).responses);
      } else {
        console.error("Error generating cover image:", {
          message: (error as any)?.message,
          name: (error as any)?.name,
          cause: (error as any)?.cause,
          responseStatus: (error as any)?.response?.status,
          responseData: (error as any)?.response?.data,
        });
      }
      // Ensure we always have a cover image for downstream fallbacks
      coverImageUrl = makePlaceholderImage(story.title);
    }

    // Helpers for robust retries
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    async function retry<T>(
      fn: () => Promise<T>,
      attempts = 3,
      baseDelayMs = 700
    ): Promise<T> {
      let lastErr: unknown;
      for (let i = 0; i < attempts; i += 1) {
        try {
          return await fn();
        } catch (err) {
          lastErr = err;
          const delay = baseDelayMs * Math.pow(2, i);
          console.warn(
            `Attempt ${i + 1}/${attempts} failed. Retrying in ${delay}ms...`
          );
          await sleep(delay);
        }
      }
      throw lastErr;
    }

    // Step 3: Generate image prompts and images in parallel with limited concurrency, retry, and fallback
    const CONCURRENCY = 1;

    async function generatePageImage(
      page: z.infer<typeof StoryPageSchema>,
      index: number
    ) {
      try {
        const imagePromptResult = await retry(() =>
          generateText({
            model: google("gemini-2.5-flash"),
            prompt: `Create a detailed, child-friendly illustration prompt for this storybook page. Use a single, consistent visual theme for the entire book as specified below.
            
            Title: ${page.title}
            Content: ${page.content}
            Characters in scene: ${page.characters.join(", ")}
            Setting: ${page.setting}
            Mood: ${page.mood}
            
            CHARACTER DESCRIPTIONS (MUST maintain exact consistency):
            ${story.characters
              .filter((char) => page.characters.includes(char.name))
              .map((char) => `${char.name}: ${char.appearance}`)
              .join("; ")}
            
             Generate a prompt for a colorful children's book illustration that captures this scene.
             Enforce this exact visual theme (do not deviate across pages): ${IMAGE_STYLE_DIRECTIVE}
             
             CRITICAL: Use the EXACT character descriptions provided above. Do NOT change clothing, colors, hair, or any physical features.
             
            Include details about:
            - The characters with their EXACT appearance as described
            - Character expressions matching the mood
            - The setting and environment
            - Colors and lighting that match the mood
            - Important objects or elements from the story
            
            ABSOLUTELY NO TEXT: Do not include any text, letters, words, signs, captions, or writing in the image.
            
            Keep it descriptive but concise (max 100 words).`,
          })
        );

        const basePrompt = imagePromptResult.text;
        const enhancedPrompt = buildImagenPrompt(basePrompt);

        // Helpful diagnostics for malformed request debugging
        console.info(`[/pages/${index + 1} Imagen Request]`, {
          model: "imagen-3.0-generate-002",
          aspectRatio: "1:1",
          promptLength: enhancedPrompt.length,
          promptPreview: enhancedPrompt.slice(0, 240),
        });

        const imageResult = await retry(
          async () =>
            await generateImage({
              model: google.image("imagen-3.0-generate-002"),
              prompt: enhancedPrompt,
              aspectRatio: "1:1",
            })
        );

        const base64Image = `data:image/png;base64,${Buffer.from(
          imageResult.image.uint8Array
        ).toString("base64")}`;

        return {
          ...page,
          imageUrl: base64Image,
          imagePrompt: enhancedPrompt,
        };
      } catch (error) {
        if ((NoImageGeneratedError as any)?.isInstance?.(error)) {
          console.error(
            `NoImageGeneratedError for page ${index + 1} cause:`,
            (error as any).cause
          );
          console.error(
            `NoImageGeneratedError for page ${index + 1} responses:`,
            (error as any).responses
          );
        } else {
          console.error(
            `Image generation failed for page ${index + 1} after retries:`,
            {
              message: (error as any)?.message,
              name: (error as any)?.name,
              cause: (error as any)?.cause,
              responseStatus: (error as any)?.response?.status,
              responseData: (error as any)?.response?.data,
            }
          );
        }
        return {
          ...page,
          imageUrl: coverImageUrl ?? makePlaceholderImage(page.title),
          imagePrompt: "[FALLBACK] Used cover image due to generation failures",
        };
      }
    }

    async function runWithConcurrency<T>(
      factories: Array<() => Promise<T>>,
      limit: number
    ): Promise<T[]> {
      const results: T[] = new Array(factories.length);
      let next = 0;
      async function worker() {
        while (true) {
          const current = next++;
          if (current >= factories.length) break;
          results[current] = await factories[current]();
        }
      }
      const workers = Array(Math.min(limit, factories.length))
        .fill(0)
        .map(() => worker());
      await Promise.all(workers);
      return results;
    }

    const factories = story.pages.map(
      (page, index) => () => generatePageImage(page, index)
    );
    const pagesWithImages = await runWithConcurrency(factories, CONCURRENCY);

    const finalStory = {
      ...story,
      pages: pagesWithImages,
      coverImageUrl,
    };

    // Step 4: Generate a coloring page image
    try {
      const coloringPagePromptResult = await generateText({
        model: google("gemini-2.5-flash"),
        prompt: `Create a prompt for a black and white coloring book page for a children's story. The image should feature the main characters in a simple, clear scene with bold outlines and no shading.
        
        Title: ${story.title}
        Main Characters: ${story.characters.map((char) => `${char.name} (${char.appearance})`).join(", ")}
        
        Generate a prompt that is simple, clear, and suitable for a coloring book page with thick outlines and no color or shading.`,
      });

      const coloringPageEnhancedPrompt = buildImagenPrompt(coloringPagePromptResult.text);
      console.info("[Coloring Page Imagen Request]", {
        model: "imagen-3.0-generate-002",
        aspectRatio: "1:1",
        promptLength: coloringPageEnhancedPrompt.length,
        promptPreview: coloringPageEnhancedPrompt.slice(0, 240),
      });

      const coloringPageImageResult = await generateImage({
        model: google.image("imagen-3.0-generate-002"),
        prompt: `coloring book page, black and white, bold outlines, no shading, ${coloringPageEnhancedPrompt}`,
        aspectRatio: "1:1",
      });

      finalStory.coloringPageImageUrl = `data:image/png;base64,${Buffer.from(
        coloringPageImageResult.image.uint8Array
      ).toString("base64")}`;

    } catch (error) {
      console.error("Error generating coloring page image:", error);
      // It's not critical, so we can fail silently
    }

    return NextResponse.json(finalStory);
  } catch (error) {
    console.error("Error generating story:", error);
    return NextResponse.json(
      { error: "Failed to generate story" },
      { status: 500 }
    );
  }
}
