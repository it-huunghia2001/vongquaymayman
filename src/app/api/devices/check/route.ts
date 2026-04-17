import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fp = searchParams.get("fp");

    if (!fp) return NextResponse.json({ status: "NONE" }, { status: 400 });

    // Truy vấn trực tiếp từ MySQL
    const device = await prisma.deviceRequest.findUnique({
      where: { deviceFingerprint: fp },
      select: { status: true },
    });

    if (!device) {
      return NextResponse.json({ status: "NOT_FOUND" });
    }

    // Trả về APPROVED, PENDING hoặc REJECTED
    return NextResponse.json({ status: device.status });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ status: "ERROR" }, { status: 500 });
  }
}
