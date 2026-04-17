// src/lib/auth.ts
import { cookies } from "next/headers";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");

  // Kiểm tra token
  if (!token || token.value !== "secure_token_here") {
    return false;
  }

  return true;
}
