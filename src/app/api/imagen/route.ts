import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400 });
    }

    const project = process.env.GCP_PROJECT;
    const location = process.env.GCP_LOCATION || "us-central1";
    const model = process.env.IMAGEN_MODEL || "imagen-3.0-generate-002";
    const token = process.env.GCLOUD_ACCESS_TOKEN;

    if (!project) {
      return new Response(JSON.stringify({ error: "Missing GCP_PROJECT" }), { status: 500 });
    }
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing GCLOUD_ACCESS_TOKEN" }), { status: 500 });
    }

    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:predict`;

    const body = {
      instances: [
        {
          prompt,
        },
      ],
      parameters: {
        sampleCount: 1,
        // aspectRatio: "1:1",
        // addWatermark: true,
        // outputOptions: { mimeType: "image/png", compressionQuality: 90 },
      },
    };

    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(body),
    });

    const json = await r.json();
    return new Response(JSON.stringify(json), { status: r.status });
  } catch (e: unknown) {
    const error = e as Error;
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500 }
    );
  }
}
