import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminSession, ADMIN_COOKIE_NAME } from "@/lib/adminSession";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  if (!verifyAdminSession(jar.get(ADMIN_COOKIE_NAME)?.value)) {
    redirect("/admin/login");
  }
  return <>{children}</>;
}
