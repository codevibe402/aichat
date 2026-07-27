import { NextRequest } from "next/server";
import { z } from "zod";
import { json, options } from "@/lib/http";
import { generateReplies } from "@/lib/ai/groq";
import { AIError } from "@/lib/ai/aierror";
import {requireUser} from "@/lib/auth"
import {unauthorized}from "@/lib/http"
const bodySchema = z.object({
  platform: z.string().optional(),
  tone: z.string().min(1).default("friendly"),
  userGoal:z.string().max(500).optional(),
  messages: z
    .array(
      z.object({
        sender: z.enum(["me", "them"]),
        text: z.string().min(1).max(4000),
      }),
    )
    .min(1),
});

export async function OPTIONS(req:NextRequest) {
  return options(req);
}

export async function POST(req: NextRequest) {
    const user = await requireUser(req);
    if (!user) return unauthorized(req);    
        

  try {
    const body = bodySchema.parse(await req.json());
    const result = await generateReplies(body);
     
   return json(req,{
    type: result.type,
    replies:result.replies,
    usage :result.usage
   } ); 
  } catch (error) {
  console.error("[api/ai/replies]", error);

  if (error instanceof AIError) {
    return json(
      req,
      { error: error.message },
      { status: error.statusCode }
    );
  }

  return json(
    req,
    { error: "Internal Server Error" },
    { status: 500 }
  );
}
}
