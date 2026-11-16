import { NextResponse } from "next/server";
import { destroySession } from "@/lib/server/auth";

/** Clears the session (and a stale cookie) and sends the user to the login page. */
export async function GET(req: Request) {
  await destroySession();
  return NextResponse.redirect(new URL("/login", req.url));
}
export const POST = GET;
