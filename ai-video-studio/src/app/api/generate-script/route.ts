import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client (requires OPENAI_API_KEY in .env.local)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // If no API key is provided, gracefully fallback to mocked response (for testing before user provides key)
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_key_here') {
      console.warn("OpenAI API Key not found. Returning MOCKED AI response.");
      return NextResponse.json({
        success: true,
        scenes: [
          {
            id: `scene_${Date.now()}_1`,
            script: "Hi there! I am your AI generated spokesperson.",
            avatarId: "stock_1",
            voiceId: "en_adam",
            backgroundUrl: "default",
            duration: 4.0
          },
          {
            id: `scene_${Date.now()}_2`,
            script: `This script is a fallback because OpenAI is not hooked up yet. You typed: "${prompt.substring(0, 50)}..."`,
            avatarId: "stock_1",
            voiceId: "en_adam",
            backgroundUrl: "default",
            duration: 6.0
          }
        ]
      });
    }

    // Real OpenAI Integration
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast, cheap, and smart enough for script chunking
      messages: [
        {
          role: 'system',
          content: `You are a professional video scriptwriter and scene director for an AI Video Generator platform. 
The user will provide a topic or raw text. Your job is to convert this into a structured JSON array of video scenes.
Each scene represents a cut in the video where an AI avatar speaks.
Keep each scene's script between 1 to 3 short sentences.
Assign appropriate 'duration' in seconds based on reading speed (~2.5 words per second).
Always output valid raw JSON. Only respond with JSON, no markdown formatting like \`\`\`json.
Format:
{
  "scenes": [
    {
      "script": "string - what the avatar says",
      "avatarId": "stock_1", 
      "voiceId": "en_charlotte",
      "backgroundUrl": "default",
      "duration": number
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Topic / Raw Text: ${prompt}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("No content generated");

    const parsed = JSON.parse(content);
    
    // Safety mapping to ensure IDs are fresh
    const finalScenes = parsed.scenes.map((s: any, i: number) => ({
      ...s,
      id: `scene_${Date.now()}_${i}`
    }));

    return NextResponse.json({ success: true, scenes: finalScenes });

  } catch (error: any) {
    console.error("OpenAI Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to generate script' }, { status: 500 });
  }
}
