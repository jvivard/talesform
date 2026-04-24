import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const CharacterSchema = z.object({
  name: z.string(),
  description: z.string(),
  appearance: z.string(),
});

const StoryPageSchema = z.object({
  pageNumber: z.number(),
  title: z.string(),
  content: z.string(),
  characters: z.array(z.string()),
  setting: z.string(),
  mood: z.string(),
});

const StorySchema = z.object({
  title: z.string(),
  pages: z.array(StoryPageSchema),
  characters: z.array(CharacterSchema),
  genre: z.string(),
  targetAge: z.string(),
});

interface StoryWithImages extends z.infer<typeof StorySchema> {
  pages: Array<z.infer<typeof StoryPageSchema> & { imageUrl?: string; imagePrompt?: string }>;
  characters: z.infer<typeof CharacterSchema>[];
  coverImageUrl?: string;
}

const NOVITA_API_KEY = process.env.NOVITA_API_KEY || "";

async function pollNovitaTask(taskId: string): Promise<string> {
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const resultRes = await fetch(
      `https://api.novita.ai/v3/async/task-result?task_id=${taskId}`,
      { headers: { Authorization: "Bearer " + NOVITA_API_KEY } }
    );
    const resultData = await resultRes.json();
    if (resultData.task?.status === "TASK_STATUS_SUCCEED") {
      return resultData.images[0].image_url;
    } else if (resultData.task?.status === "TASK_STATUS_FAILED") {
      throw new Error("Novita task failed: " + JSON.stringify(resultData));
    }
  }
}

async function generateNovitaTxt2Img(prompt: string): Promise<string> {
  const submitRes = await fetch(
    "https://api.novita.ai/v3/async/qwen-image-txt2img",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + NOVITA_API_KEY,
      },
      body: JSON.stringify({
        model_name: "qwen-image",
        prompt: prompt,
        image_num: 1,
        width: 1024,
        height: 1024,
      }),
    }
  );
  const submitData = await submitRes.json();
  if (!submitData.task_id) throw new Error("Failed to start txt2img task: " + JSON.stringify(submitData));
  return pollNovitaTask(submitData.task_id);
}

async function generateNovitaEditImg(prompt: string, initImageUrl: string): Promise<string> {
  // Fetch image as base64
  const imageRes = await fetch(initImageUrl);
  const arrayBuffer = await imageRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Image = buffer.toString('base64');

  const submitRes = await fetch(
    "https://api.novita.ai/v3/async/qwen-image-edit",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + NOVITA_API_KEY,
      },
      body: JSON.stringify({
        model_name: "qwen-image",
        prompt: prompt,
        image_base64: base64Image,
        image_num: 1,
        width: 1024,
        height: 1024,
      }),
    }
  );
  const submitData = await submitRes.json();
  
  // If base64 fails due to parameter name, fallback to URL parameter
  if (!submitData.task_id) {
    console.warn("Retrying with image URL parameter", submitData);
    const submitResUrl = await fetch(
      "https://api.novita.ai/v3/async/qwen-image-edit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + NOVITA_API_KEY,
        },
        body: JSON.stringify({
          model_name: "qwen-image",
          prompt: prompt,
          image: initImageUrl,
          image_num: 1,
          width: 1024,
          height: 1024,
        }),
      }
    );
    const submitDataUrl = await submitResUrl.json();
    if (!submitDataUrl.task_id) throw new Error("Failed to start edit task: " + JSON.stringify(submitDataUrl));
    return pollNovitaTask(submitDataUrl.task_id);
  }
  
  return pollNovitaTask(submitData.task_id);
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

    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    let finalPrompt = prompt;
    if (!prompt && (characterName || gender || customElements || setting)) {
      const parts: string[] = [];
      if (characterName) parts.push(`The main character is named ${characterName}`);
      if (gender) parts.push(`The character is a ${gender === "neutral" ? "gender-neutral" : gender}`);
      if (customElements) parts.push(customElements);
      if (setting) parts.push(`The story takes place in ${setting}`);
      
      finalPrompt = parts.length > 0 
        ? `Create a children's story with the following details: ${parts.join(". ")}.`
        : "Create a fun and educational children's story with interesting characters and an engaging plot.";
    }

    if (!finalPrompt) {
      return NextResponse.json({ error: "Prompt or story details are required" }, { status: 400 });
    }

    const IMAGE_STYLE_DIRECTIVE = `
      Consistent children's book watercolor illustration theme with soft pastel colors and gentle lighting; 
      hand-painted feel with clean outlines; cute rounded proportions; consistent character designs across all pages. 
      STRICTLY NO TEXT, NO LETTERS, NO WORDS, NO WRITING anywhere.
    `.replace(/\s+/g, " ").trim();

    const makePlaceholderImage = (title: string) => {
      const safeTitle = (title || "Story").slice(0, 40);
      const svg = `<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024'><rect width='1024' height='1024' fill='#ccc'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='64'>${safeTitle}</text></svg>`;
      return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    };

    // Step 1: Generate Story Structure
    const storyResult = await generateObject({
      model: anthropic("claude-haiku-4-5-20251001"),
      schema: StorySchema,
      prompt: `Create a children's storybook based on this prompt: "${finalPrompt}". 
      Exactly ${pageCount} pages. Include:
      - Page title, 2-3 sentences of content, characters, setting, mood.
      - Detailed character descriptions including physical appearance (clothing, colors, hair, features).
      Make it educational and fun for 4-8 years.`,
    });

    const story = storyResult.object as StoryWithImages;

    // Step 2: Generate Cover Image (txt2img)
    let coverImageUrl: string | undefined;
    try {
      const coverPromptResult = await generateText({
        model: anthropic("claude-haiku-4-5-20251001"),
        prompt: `Create a concise cover image prompt (max 80 words).
        Title: ${story.title}
        Main Characters: ${story.characters.map((char) => `${char.name} (${char.appearance})`).join(", ")}
        Theme: ${IMAGE_STYLE_DIRECTIVE}`,
      });

      coverImageUrl = await generateNovitaTxt2Img(coverPromptResult.text);
    } catch (error) {
      console.error("Error generating cover image:", error);
      coverImageUrl = makePlaceholderImage(story.title);
    }

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    async function retry<T>(fn: () => Promise<T>, attempts = 3, baseDelayMs = 700): Promise<T> {
      let lastErr: unknown;
      for (let i = 0; i < attempts; i += 1) {
        try {
          return await fn();
        } catch (err) {
          lastErr = err;
          const delay = baseDelayMs * Math.pow(2, i);
          console.warn(`Attempt ${i + 1}/${attempts} failed. Retrying in ${delay}ms...`);
          await sleep(delay);
        }
      }
      throw lastErr;
    }

    // Step 3: Generate Page Images using Cover-to-Edit
    // We run sequentially to avoid overloading if the free tier API or to ensure stability,
    // but we can also map in parallel up to CONCURRENCY.
    const CONCURRENCY = 2;

    async function generatePageImage(page: z.infer<typeof StoryPageSchema>, index: number) {
      try {
        const imagePromptResult = await retry(() =>
          generateText({
            model: anthropic("claude-haiku-4-5-20251001"),
            prompt: `Create a concise image edit prompt for this storybook page (max 100 words).
            Page Title: ${page.title}
            Content: ${page.content}
            Characters: ${story.characters.filter((char) => page.characters.includes(char.name)).map((char) => `${char.name}: ${char.appearance}`).join("; ")}
            Setting: ${page.setting}
            Theme: ${IMAGE_STYLE_DIRECTIVE}
            CRITICAL: Maintain EXACT character appearances from descriptions.`,
          })
        );

        const enhancedPrompt = imagePromptResult.text;
        
        let pageImageUrl;
        if (coverImageUrl && !coverImageUrl.startsWith('data:')) {
            // Use Edit API if we have a valid cover URL
            pageImageUrl = await retry(() => generateNovitaEditImg(enhancedPrompt, coverImageUrl));
        } else {
            // Fallback to txt2img if cover failed
            pageImageUrl = await retry(() => generateNovitaTxt2Img(enhancedPrompt));
        }

        return { ...page, imageUrl: pageImageUrl, imagePrompt: enhancedPrompt };
      } catch (error) {
        console.error(`Image generation failed for page ${index + 1}:`, error);
        return { ...page, imageUrl: coverImageUrl ?? makePlaceholderImage(page.title), imagePrompt: "[FALLBACK]" };
      }
    }

    async function runWithConcurrency<T>(factories: Array<() => Promise<T>>, limit: number): Promise<T[]> {
      const results: T[] = new Array(factories.length);
      let next = 0;
      async function worker() {
        while (true) {
          const current = next++;
          if (current >= factories.length) break;
          results[current] = await factories[current]();
        }
      }
      const workers = Array(Math.min(limit, factories.length)).fill(0).map(() => worker());
      await Promise.all(workers);
      return results;
    }

    const factories = story.pages.map((page, index) => () => generatePageImage(page, index));
    const pagesWithImages = await runWithConcurrency(factories, CONCURRENCY);

    const finalStory = { ...story, pages: pagesWithImages, coverImageUrl };
    return NextResponse.json(finalStory);
  } catch (error) {
    console.error("Error generating story:", error);
    return NextResponse.json({ error: "Failed to generate story" }, { status: 500 });
  }
}
