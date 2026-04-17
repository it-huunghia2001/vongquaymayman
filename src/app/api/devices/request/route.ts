/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { fingerprint, deviceName } = await req.json();

    if (!fingerprint)
      return NextResponse.json(
        { error: "Thiếu thông tin máy" },
        { status: 400 },
      );

    const request = await prisma.deviceRequest.upsert({
      where: { deviceFingerprint: fingerprint },
      update: { status: "PENDING" }, // Nếu gửi lại thì đưa về chờ duyệt
      create: {
        deviceFingerprint: fingerprint,
        deviceName: deviceName || "Thiết bị không tên",
      },
    });

    return NextResponse.json(request);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
