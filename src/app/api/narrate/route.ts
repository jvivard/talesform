import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export async function POST(request: NextRequest) {
  try {
    console.log("=== Narrate API called ===");
    const { pages } = await request.json();
    console.log("Received pages:", pages?.length);

    if (!pages || !Array.isArray(pages)) {
      console.error("Invalid pages array");
      return NextResponse.json(
        { error: "Pages array is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    console.log("API Key present:", !!apiKey);
    
    if (!apiKey) {
      console.error("Missing ELEVENLABS_API_KEY environment variable");
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }

    console.log("Creating ElevenLabs client...");
    const elevenlabs = new ElevenLabsClient({ apiKey });

    // Generate audio for all pages
    console.log("Starting audio generation for", pages.length, "pages...");
    const audioResults = await Promise.all(
      pages.map(async (page: { pageNumber: number; content: string }) => {
        try {
          console.log(`Generating audio for page ${page.pageNumber}...`);
          const audio = await elevenlabs.textToSpeech.convert(
            "GTtzqc49rk4I6RwPWgd4", // Voice ID
            {
              text: page.content,
              modelId: "eleven_multilingual_v2",
              outputFormat: "mp3_44100_128",
            }
          );
          console.log(`Audio generated for page ${page.pageNumber}`);

          // Convert audio stream to base64
          const chunks: Uint8Array[] = [];
          const reader = audio.getReader();
          let done = false;
          while (!done) {
            const result = await reader.read();
            if (result.value) {
              chunks.push(result.value);
            }
            done = result.done;
          }
          const audioBuffer = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
          const base64Audio = audioBuffer.toString("base64");

          console.log(`Page ${page.pageNumber}: Generated ${base64Audio.length} bytes`);
          return {
            pageNumber: page.pageNumber,
            audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
          };
        } catch (error: unknown) {
          const err = error as Error;
          console.error(`❌ Error generating audio for page ${page.pageNumber}:`);
          console.error("Error message:", err?.message);
          console.error("Error name:", err?.name);
          console.error("Error stack:", err?.stack);
          console.error("Full error:", JSON.stringify(error, null, 2));
          return {
            pageNumber: page.pageNumber,
            audioUrl: null,
            error: err?.message || "Failed to generate audio",
          };
        }
      })
    );

    console.log("All audio generation complete");
    return NextResponse.json({ audioResults });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("❌ Fatal error in narrate API:");
    console.error("Error message:", err?.message);
    console.error("Error name:", err?.name);
    console.error("Error stack:", err?.stack);
    console.error("Full error:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: `Failed to generate narration: ${err?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}


