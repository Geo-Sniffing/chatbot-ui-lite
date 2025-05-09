import { Message } from "@/types";
import { OpenAIStream } from "@/utils";

export const config = {
  runtime: "edge"
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { messages } = (await req.json()) as { messages: Message[] };

    const systemPrompt = process.env.DEFAULT_SYSTEM_PROMPT || "You are a helpful assistant.";

    const messagesToSend: Message[] = [
      {
        role: "system" as const,
        content: systemPrompt
      },
      {
        role: "user" as const,
        content: "whats the weather like?"
      }
    ];

    let charCount = messagesToSend.reduce((sum, m) => sum + m.content.length, 0);
    const charLimit = 12000;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      if (charCount + message.content.length > charLimit) break;
      charCount += message.content.length;
      messagesToSend.push(message);
    }

    const stream = await OpenAIStream(messagesToSend);
    return new Response(stream);
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
};

export default handler;
