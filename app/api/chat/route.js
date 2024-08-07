import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const systemPrompt = "You are an AI assistant who helps users with their queries";

export async function POST(req) {
  const openai = new OpenAI(); // Ensure this is correctly initialized with your API key

  try {
    const data = await req.json(); // Parse the JSON body of the incoming request

    // Use the correct model name here, e.g., 'gpt-4' or 'gpt-3.5-turbo'
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, ...data],
      model: 'gpt-4', // Replace with the correct model name if needed
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);
  } catch (error) {
    console.error('Error handling POST request:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
