import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Đảm bảo đường dẫn này đúng với file prisma dùng chung của bạn

export async function GET() {
  try {
    const devices = await prisma.deviceRequest.findMany({
      orderBy: {
        createdAt: "desc", // Mới nhất hiện lên đầu
      },
    });
    return NextResponse.json(devices);
  } catch (error) {
    console.error("Lỗi lấy danh sách thiết bị:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
