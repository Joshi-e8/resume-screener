// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth/authOptions";

export const GET = handlers.GET;
export const POST = handlers.POST;