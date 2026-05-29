import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAdminSession, ADMIN_COOKIE_NAME } from "@/lib/adminSession";

export async function requireAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  if (!verifyAdminSession(jar.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
