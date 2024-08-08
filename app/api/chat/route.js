import { NextResponse } from 'next/server';
import Groq from "groq-sdk";

const systemPrompt = "You are an online AI assistant for Headstarter, a software engineering company building a community of sofware engineers. You are to help all users that ask you questions.";

export async function POST(req) {
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
    });
const data = await req.json();

const completion = await groq.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data],
    model: "llama3-8b-8192",
  });
 return NextResponse.json({message: completion.choices[0]?.message?.content}, {status: 200});
}