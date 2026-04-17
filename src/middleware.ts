/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;
  console.log("-------------");

  // 1. Loại trừ các file hệ thống và trang đăng ký
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname === "/request-access" ||
    pathname === "/favicon.ico" ||
    pathname === "/login"
  ) {
    return NextResponse.next();
  }

  // 2. Bảo vệ trang Admin (Dùng Token cũ của bạn)
  if (pathname.startsWith("/admin")) {
    const adminToken = req.cookies.get("admin_token")?.value;
    if (!adminToken) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  // 3. Kiểm tra thiết bị cho tất cả các trang khác (bao gồm cả trang chủ /)
  const fingerprint = req.cookies.get("device_fingerprint")?.value;
  console.log("-------------");
  console.log("nè" + fingerprint);
  console.log("-------------");

  if (!fingerprint) {
    return NextResponse.redirect(new URL("/request-access", req.url));
  }

  try {
    // Ép fetch KHÔNG dùng cache bằng cách thêm t=[thời gian]
    const checkUrl = `${origin}/api/devices/check?fp=${fingerprint}&t=${Date.now()}`;
    const res = await fetch(checkUrl, { cache: "no-store" });
    const data = await res.json();
    console.log(data);

    if (data.status !== "APPROVED") {
      return NextResponse.redirect(new URL("/request-access", req.url));
    }
  } catch (e) {
    // Nếu lỗi kết nối, tạm thời chặn để đảm bảo an toàn
    return NextResponse.redirect(new URL("/request-access", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Khớp tất cả các đường dẫn trừ các file tĩnh
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
