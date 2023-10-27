import openai from "@/lib/openai";
import { createClient } from "@/lib/supabase/supabase-server";
import { NextResponse } from "next/server";
const apiKey = ""

export async function POST(req: Request): Promise<Response> {
  const { message, model } = await req.json();
  if (!message) {
    return new Response("No response!", { status: 400 });
  }

  const msg_emb:any[]
  // Create Supabase Server Client
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session, return 401
  if (!session) {
    return new Response("Not authorized!", { status: 401 });
  }

  // Create OpenAI Client
  const openaiClient = openai(apiKey);

  try {
    // Create Embeddings
    message.map(async (i: number) => {
      const { data } = await openaiClient.createEmbedding({
        model: model,
        input: message
      });
      msg_emb[i] = data.data
    })
    // const { data } = await openaiClient.createEmbedding({
    //   model: model,
    //   input: message
    // });

    // const embeddings = data.data;
    // message["embeding"] = data.data
    // if (!embeddings) {
    //   return NextResponse.json(
    //     { message: "Something went wrong!" },
    //     { status: 500 }
    //   );
    // }
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }


  const { messages } = await message.json();
  // If no message, return 400
  if (!messages) {
    return new Response("No message!", { status: 400 });
  }

  // Insert Message
  const { data: messagesInserted, error } = await supabase
    .from("messages")
    .insert(
      messages.map((message: any, i: number) => {
        return {
          chat: message.chat,
          content: message.content,
          owner: session?.user?.id,
          embedding: msg_emb[i].embedding,
          prompt: message.prompt,
          token_size: message.token_size,
        };
      })
    )
    .select("id,role,content");

  if (error) {
    console.log(error);
    return new Response(error.message, { status: 400 });
  } else {
    return NextResponse.json(messagesInserted);
  }
}


