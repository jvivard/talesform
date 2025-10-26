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
          const chunks: Buffer[] = [];
          for await (const chunk of audio) {
            chunks.push(Buffer.from(chunk));
          }
          const audioBuffer = Buffer.concat(chunks);
          const base64Audio = audioBuffer.toString("base64");

          console.log(`Page ${page.pageNumber}: Generated ${base64Audio.length} bytes`);
          return {
            pageNumber: page.pageNumber,
            audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
          };
        } catch (error: any) {
          console.error(`❌ Error generating audio for page ${page.pageNumber}:`);
          console.error("Error message:", error?.message);
          console.error("Error name:", error?.name);
          console.error("Error stack:", error?.stack);
          console.error("Full error:", JSON.stringify(error, null, 2));
          return {
            pageNumber: page.pageNumber,
            audioUrl: null,
            error: error?.message || "Failed to generate audio",
          };
        }
      })
    );

    console.log("All audio generation complete");
    return NextResponse.json({ audioResults });
  } catch (error: any) {
    console.error("❌ Fatal error in narrate API:");
    console.error("Error message:", error?.message);
    console.error("Error name:", error?.name);
    console.error("Error stack:", error?.stack);
    console.error("Full error:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: `Failed to generate narration: ${error?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}


