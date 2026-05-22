import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirects authenticated users away from auth pages before any HTML is sent.
 * The `devquest_session` cookie is a client-set UX hint — not a security boundary.
 * Firebase Auth remains the authoritative source of truth inside the app.
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has("devquest_session");

  if (hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/register", "/forgot-password"],
};
