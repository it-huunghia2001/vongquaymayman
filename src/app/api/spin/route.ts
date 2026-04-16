/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import nodemailer from "nodemailer";

dayjs.extend(utc);
dayjs.extend(timezone);

// ===============================
// ⚙️ GỬI MAIL CẢNH BÁO HẾT QUÀ
// ===============================
async function sendLowStockMail(prizeName: string, quantity: number) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Lucky Spin" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `⚠️ Phần thưởng gần hết: ${prizeName}`,
      html: `
        <h3>Thông báo số lượng quà tặng gần hết</h3>
        <p>Phần thưởng <b>${prizeName}</b> hiện chỉ còn lại <b>${quantity}</b> phần.</p>
        <p>Hãy kiểm tra và bổ sung nếu cần.</p>
      `,
    });

    console.log(`📧 Đã gửi mail cảnh báo quà ${prizeName} còn ${quantity}`);
  } catch (err) {
    console.error("❌ Lỗi gửi mail:", err);
  }
}

// ===============================
// 🎯 HÀM RANDOM THEO TRỌNG SỐ
// ===============================
function pickPrizeByRatio(
  prizes: { id: number; name: string; ratio: number }[],
) {
  const total = prizes.reduce((sum, p) => sum + p.ratio, 0);
  const random = Math.random() * total;

  let cumulative = 0;
  for (const p of prizes) {
    cumulative += p.ratio;
    if (random <= cumulative) return p;
  }

  // fallback (hiếm khi xảy ra)
  return prizes[prizes.length - 1];
}

// ===============================
// 🚀 API QUAY THƯỞNG
// ===============================
export async function POST(req: Request) {
  try {
    const { phone, deviceKey, plateNumber } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, message: "Thiếu số điện thoại" },
        { status: 400 },
      );
    }

    if (!plateNumber) {
      return NextResponse.json(
        { success: false, message: "Thiếu biển số xe" },
        { status: 400 },
      );
    }

    // Chuẩn hóa dữ liệu đầu vào
    const normalizedPlate = plateNumber.trim().toUpperCase();
    const encryptedPhone = encrypt(phone);

    // Tìm user theo SĐT hoặc biển số
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ phone: encryptedPhone }, { licensePlate2: normalizedPlate }],
      },
      select: { id: true, name: true, phone: true, licensePlate2: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Người dùng không tồn tại" },
        { status: 404 },
      );
    }

    // Giới hạn 1 lần quay mỗi ngày (VN timezone)
    const startOfDay = dayjs().tz("Asia/Ho_Chi_Minh").startOf("day").toDate();
    const endOfDay = dayjs().tz("Asia/Ho_Chi_Minh").endOf("day").toDate();

    const spunToday = await prisma.spinHistory.findFirst({
      where: {
        OR: [{ phone: encryptedPhone }, { plateNumber: normalizedPlate }],
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (spunToday) {
      return NextResponse.json({
        success: true,
        prize: spunToday.prize,
        message:
          "Số điện thoại hoặc biển số xe này đã quay hôm nay, hãy quay lại vào ngày mai!",
        alreadySpun: true,
      });
    }

    // Lấy danh sách phần thưởng còn hàng
    const prizes = await prisma.prizeConfig.findMany({
      where: { quantity: { gt: 0 } },
      orderBy: { id: "asc" },
    });

    if (!prizes.length) {
      return NextResponse.json(
        { success: false, message: "Hết phần thưởng." },
        { status: 500 },
      );
    }

    // 🎯 Chọn phần thưởng theo tỉ lệ
    const selected = pickPrizeByRatio(prizes);

    // 🔒 Transaction: giảm số lượng & ghi lịch sử
    const updatedPrize = await prisma.$transaction(
      async (tx) => {
        const prize = await tx.prizeConfig.findUnique({
          where: { id: selected.id },
        });
        if (!prize || prize.quantity <= 0)
          throw new Error("Phần thưởng đã hết");

        const updated = await tx.prizeConfig.update({
          where: { id: selected.id },
          data: { quantity: { decrement: 1 } },
        });

        // Gửi mail nếu quà gần hết
        // if (updated.quantity < 3) await sendLowStockMail(updated.name, updated.quantity);

        // Ghi lại lịch sử quay
        const ip =
          req.headers.get("x-forwarded-for") ||
          req.headers.get("x-real-ip") ||
          "";
        const userAgent = req.headers.get("user-agent") || "";

        await tx.spinHistory.create({
          data: {
            phone: encryptedPhone,
            prize: updated.name,
            ip: String(ip),
            name: user.name,
            userAgent,
            plateNumber: normalizedPlate,
            ...(deviceKey ? { deviceKey } : {}),
          },
        });

        return updated;
      },
      {
        timeout: 15000, // tăng lên 15 giây
      },
    );

    return NextResponse.json({
      success: true,
      prize: updatedPrize.name,
      prizeId: updatedPrize.id,
      message: "🎉 Chúc mừng bạn đã quay thành công!",
    });
  } catch (error: any) {
    console.error("🔥 Lỗi khi xử lý quay thưởng:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi máy chủ" },
      { status: 500 },
    );
  }
}
