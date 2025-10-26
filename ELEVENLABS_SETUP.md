# ElevenLabs Text-to-Speech Integration

This project includes smart text-to-speech narration powered by ElevenLabs AI.

## Features

- **Smart Lazy Loading**: Audio is only generated when the user clicks the play button on the first page
- **Batch Generation**: Once requested, all page narrations are generated at once
- **Memory Caching**: Generated audio is cached in memory to avoid redundant API calls
- **Cost-Efficient**: No audio is generated if the user prefers reading
- **Play/Pause Controls**: Each page has its own play/pause button next to the page number

## Setup Instructions

### 1. Get Your ElevenLabs API Key

1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up or log in
3. Navigate to your [Profile Settings](https://elevenlabs.io/app/settings)
4. Copy your API key

### 2. Configure Environment Variable

Create a `.env.local` file in your project root (or add to existing one):

```bash
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
```

### 3. Run the Application

```bash
npm run dev
# or
bun run dev
```

## How It Works

### Smart Loading Architecture

1. **Initial State**: No audio is generated when the story loads
2. **First Play Click**: When user clicks play on ANY page for the first time:
   - System generates audio for ALL pages in parallel
   - Play button shows a spinner during generation
   - Generated audio is cached in browser memory
3. **Subsequent Plays**: Audio plays instantly from cache

### User Experience

- **Visual Feedback**: 
  - Play icon (▶️) when audio is ready but not playing
  - Pause icon (⏸️) when audio is currently playing
  - Spinner when audio is being generated
- **Auto-Stop**: Only one page narration plays at a time
- **Clean Up**: All audio is properly cleaned up when leaving the story page

## API Endpoint

### POST `/api/narrate`

Generates audio narration for story pages.

**Request Body:**
```json
{
  "pages": [
    {
      "pageNumber": 1,
      "content": "Leo the lion cub looked everywhere..."
    }
  ]
}
```

**Response:**
```json
{
  "audioResults": [
    {
      "pageNumber": 1,
      "audioUrl": "data:audio/mpeg;base64,..."
    }
  ]
}
```

## Voice Customization

To change the narrator voice, edit `src/app/api/narrate/route.ts`:

```typescript
const audio = await elevenlabs.generate({
  voice: "Rachel", // Change this to any ElevenLabs voice ID
  text: page.content,
  model_id: "eleven_multilingual_v2",
});
```

Popular voices:
- `Rachel` - Calm, friendly female voice
- `Adam` - Clear, warm male voice
- `Bella` - Soft, expressive female voice
- `Josh` - Deep, authoritative male voice

[Browse all voices](https://elevenlabs.io/voice-library)

## Cost Optimization

The smart loading architecture ensures:
- **Zero cost** if users don't click play
- **Single batch generation** per story (not per page)
- **No redundant API calls** thanks to memory caching
- **Efficient API usage** with parallel generation

## Troubleshooting

### "ElevenLabs API key not configured"
- Ensure `.env.local` exists with `ELEVENLABS_API_KEY`
- Restart your dev server after adding the key

### Audio not playing
- Check browser console for errors
- Ensure browser allows audio playback
- Try clicking play again (first click might be blocked by browser autoplay policy)

### Generation too slow
- Default model (`eleven_multilingual_v2`) balances quality and speed
- For faster generation, switch to `eleven_turbo_v2`
- For higher quality, use `eleven_monolingual_v1`

## Production Deployment

When deploying to Cloud Run, add the environment variable:

```bash
gcloud run deploy storybook \
  --set-env-vars ELEVENLABS_API_KEY=your-key-here \
  ...
```

Or add it via the Cloud Console:
1. Go to Cloud Run service
2. Edit & Deploy New Revision
3. Variables & Secrets → Add Variable
4. Name: `ELEVENLABS_API_KEY`, Value: your key


