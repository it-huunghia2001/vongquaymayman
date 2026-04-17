import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Đảm bảo bạn đã tạo file prisma dùng chung như hướng dẫn trước

export async function GET() {
  try {
    const pendingDevices = await prisma.deviceRequest.findMany({
      where: {
        status: "PENDING", // Chỉ lấy các máy đang chờ
      },
      orderBy: {
        createdAt: "desc", // Máy mới yêu cầu hiện lên đầu
      },
    });

    return NextResponse.json(pendingDevices);
  } catch (error) {
    console.error("Lỗi lấy danh sách chờ duyệt:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
