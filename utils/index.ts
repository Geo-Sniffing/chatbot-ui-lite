import { Message } from "@/types";
import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";

export const OpenAIStream = async (messages: Message[]) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo", // or "gpt-4"
      messages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: true
    })
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenAI API error: ${res.status} - ${error}`);
  }

  const parser = createParser((event: ParsedEvent | ReconnectInterval) => {
    if (event.type === "event") {
      const data = event.data;

      if (data === "[DONE]") {
        controller.close();
        return;
      }

      try {
        const json = JSON.parse(data);
        const text = json.choices?.[0]?.delta?.content;
        if (text) {
          controller.enqueue(encoder.encode(text));
        }
      } catch (e) {
        console.error("Parse error:", e);
      }
    }
  });

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    }
  });

  return stream;
};
