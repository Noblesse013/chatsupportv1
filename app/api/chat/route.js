import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your .env file
});

const systemPrompt = "The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly. \n\nHuman: Hello, who are you?\nAI: I am an AI assistant. How can I help you today?\nHuman: What can you do for me?\nAI: I can help you find information, answer questions, or just chat with you. If you have any questions, feel free to ask.\nHuman: Can you tell me a joke?\nAI: Sure! Why did the scarecrow win an award? Because he was outstanding in his field!";

export async function POST(req) {
  const data = await req.json();
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: data.content }
  ];

  const completion = openai.chat.completions.create({
    model: 'gpt-4',
    messages: messages,
    stream: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const text = new TextEncoder().encode(content);
            controller.enqueue(text);
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}

