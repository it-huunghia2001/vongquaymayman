/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { requireAdmin } from "../admin/prizes/route";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function POST(req: Request) {
  try {
    if (!requireAdmin()) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const { name, phone, licensePlate } = await req.json();

    // Bắt buộc phải có biển số xe
    if (!licensePlate) {
      return NextResponse.json(
        { allowed: false, message: "Phải nhập Số CCCD!" },
        { status: 400 },
      );
    }

    // Chuẩn hóa + mã hóa
    const encryptedPhone = phone ? encrypt(phone) : null;
    const encryptedName = name ? encrypt(name) : null;
    const normalizedPlate = licensePlate.trim().toUpperCase();

    // Tìm user theo biển số xe
    let user = await prisma.user.findFirst({
      where: { licensePlate2: normalizedPlate },
    });

    // Ngày hôm nay theo múi giờ VN
    const startOfDay = dayjs().tz("Asia/Ho_Chi_Minh").startOf("day").toDate();
    const endOfDay = dayjs().tz("Asia/Ho_Chi_Minh").endOf("day").toDate();

    // Nếu user đã tồn tại → kiểm tra đã quay trong ngày chưa (chỉ theo biển số)
    if (user) {
      const spunToday = await prisma.spinHistory.findFirst({
        where: {
          plateNumber: normalizedPlate,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      });

      if (spunToday) {
        return NextResponse.json(
          {
            allowed: false,
            message: "Biển số xe này đã quay thưởng hôm nay!",
          },
          { status: 400 },
        );
      }
    } else {
      // Nếu chưa có user thì tạo mới
      user = await prisma.user.create({
        data: {
          name: encryptedName ?? "Người dùng",
          phone: encryptedPhone ?? "",
          licensePlate2: normalizedPlate,
          hasSpun: false,
        },
      });
    }

    // Nếu tới đây thì user chưa quay hôm nay → cho phép tham gia
    return NextResponse.json({ allowed: true, userId: user.id });
  } catch (error) {
    console.error("Lỗi khi kiểm tra/tạo user:", error);
    return NextResponse.json(
      { allowed: false, message: "Lỗi server!" },
      { status: 500 },
    );
  }
}
