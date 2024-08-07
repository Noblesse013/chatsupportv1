import OpenAI from "openai";
import { NextResponse } from "next/server";

// Define the system prompt for the AI model
const systemPrompt = `You are a customer support bot for Headstarter AI, a platform for AI-powered interviews for software engineering jobs. You are professional, knowledgeable, and dedicated to assisting users. Answer questions about the platform, its features, and provide guidance based on the following examples:

1. Headstarter AI is a platform that uses artificial intelligence to conduct technical interviews for software engineering roles, providing evaluations and feedback.
2. To get started, sign up on our website, complete your profile, and schedule an interview. Our AI will guide you through the process and evaluate your skills.
3. Our platform offers a variety of features, including coding challenges, mock interviews, and personalized feedback to help you improve your technical skills.
4. If you encounter any technical issues, contact our support team via email or live chat. We’re here to assist you and ensure a smooth experience.
5. For more information about our platform, visit our website or check out our FAQ section. We’re happy to help you succeed in your job search!
6. Always be professional and helpful in your responses to users.

Your goal is to provide accurate and informative responses to user inquiries. Be polite, patient, and professional in your interactions.`;        

export async function POST(req) {
   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // Initialize OpenAI client with API key

   const data = await req.json();

   // Ensure data is in the correct format
   const userMessage = data.message || '';

   // Create a prompt with the system instructions and user input
   const messages = [
     { role: 'system', content: systemPrompt },
     { role: 'user', content: userMessage },
   ];

   try {
     const completion = await openai.completions.create({
       model: 'gpt-4',
       messages: messages,
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
         } catch (error) {
           controller.error(error);
         } finally {
           controller.close();
         }
       }, 
     });

     return new Response(stream);
   } catch (error) {
     return new Response('Failed to fetch response from AI model', { status: 500 });
   }
}
