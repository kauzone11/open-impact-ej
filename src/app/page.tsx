import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HUB_ACCOUNT_SESSION_COOKIE, HUB_SESSION_COOKIE } from "@/lib/hub/auth";

export default async function RootPage() {
  const cookieStore = await cookies();
  redirect(cookieStore.has(HUB_SESSION_COOKIE) || cookieStore.has(HUB_ACCOUNT_SESSION_COOKIE) ? "/inicio" : "/login");
}
