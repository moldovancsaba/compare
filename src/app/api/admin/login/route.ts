import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signAdminSession, ADMIN_COOKIE_NAME } from "@/lib/adminSession";

export async function POST(req: Request) {
  const pass = process.env.ADMIN_PASSWORD?.trim();
  if (!pass) {
    const vercelHint = process.env.VERCEL
      ? " If you just set variables in the Vercel dashboard, trigger a new Production deployment so they apply."
      : "";
    return NextResponse.json(
      {
        error:
          "ADMIN_PASSWORD is not configured. Next.js only loads .env / .env.local (not .env.example). On Vercel, set ADMIN_PASSWORD under Project → Settings → Environment Variables." +
          vercelHint,
      },
      { status: 500 },
    );
  }
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const submitted = typeof body.password === "string" ? body.password.trim() : "";
  if (submitted !== pass) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const token = signAdminSession();
  const jar = await cookies();
  jar.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return NextResponse.json({ ok: true });
}
