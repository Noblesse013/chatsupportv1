import OpenAI from "openai";
import { NextResponse } from "next/server";

const systemPrompt = "The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly. \n\nHuman: Hello, who are you?\nAI: I am an AI assistant. How can I help you today?\nHuman: What can you do for me?\nAI: I can help you find information, answer questions, or just chat with you. If you have any questions, feel free to ask.\nHuman: Can you tell me a joke?\nAI: Sure! Why did the scarecrow win an award? Because he was outstanding in his field!";        

export async function POST(req) {
   const openai= new OpenAI()
   const data = await req.json()

   const completion = await openai.completions.create({
    message: [
    {

        role: 'system',
        content: systemPrompt,
    },
    ...data,
     ],
    model: 'gpt-4o-mini',
    stream: true,

})
   const stream = new ReadableStream({  
    async start(controller) {
        const encoder =new TextEncoder()
        try{
        for await (const message of completion) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
                const text = encoder.encode(content)
                controller.enqueue(text)
            }
        } 
        } catch (error) {
            controller.error(error)
        }finally{
            controller.close()
        }
    }, 
 })
  return new Response(stream, {
    headers: {
        'Content-Type': 'text/plain; charset=utf-8'
    }
  })
}
