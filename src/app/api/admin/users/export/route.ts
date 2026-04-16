/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import ExcelJS from "exceljs";

// 🔹 Hàm chuẩn hóa tên phần thưởng
function normalizePrizeName(name: string): string {
  return name
    .normalize("NFD") // tách dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, "") // xóa dấu
    .replace(/\s+/g, "") // bỏ khoảng trắng
    .toLowerCase()
    .trim();
}

export async function GET() {
  try {
    // 👉 Lấy tất cả lịch sử quay có prize
    const histories = await prisma.spinHistory.findMany({
      where: { prize: { not: "" } },
      orderBy: { createdAt: "desc" },
    });

    // 👉 Map sang winners (join User qua licensePlate2)
    const winners = await Promise.all(
      histories.map(async (h) => {
        // Giải mã phone trong spinHistory
        let phone = "Không đọc được";
        try {
          if (h.phone) phone = decrypt(h.phone);
        } catch {
          console.warn(`❗ Không giải mã được phone spinHistory ID ${h.id}`);
        }

        // 🔹 Luôn join user theo biển số
        let user = null;
        if (h.plateNumber) {
          user = await prisma.user.findFirst({
            where: { licensePlate2: h.plateNumber },
            select: { id: true, name: true, phone: true, licensePlate2: true },
          });
        }

        // Giải mã name
        let name = "Không rõ";
        try {
          if (user?.name) name = decrypt(user.name);
        } catch {
          console.warn(`❗ Không giải mã được name user ID ${user?.id}`);
        }

        // Giải mã phone từ user (ưu tiên user.phone)
        let displayPhone = phone;
        try {
          if (user?.phone) displayPhone = decrypt(user.phone);
        } catch {
          // fallback đã có
        }

        return {
          id: h.id,
          name,
          phone: displayPhone,
          licensePlate: h.plateNumber ?? user?.licensePlate2 ?? "—",
          prize: h.prize,
          createdAt: h.createdAt,
        };
      }),
    );

    // 👉 Gom thống kê phần thưởng (normalize để gộp tên trùng)
    const spinPrizes = await prisma.spinHistory.findMany({
      where: { prize: { not: "" } },
      select: { prize: true },
    });

    const prizeCountsMap: Record<string, number> = {};
    const originalNamesMap: Record<string, string> = {};

    for (const { prize } of spinPrizes) {
      if (!prize) continue;
      const normalized = normalizePrizeName(prize);
      prizeCountsMap[normalized] = (prizeCountsMap[normalized] || 0) + 1;
      if (!originalNamesMap[normalized]) {
        originalNamesMap[normalized] = prize.trim();
      }
    }

    const prizeConfigs = await prisma.prizeConfig.findMany();

    // 👉 Hợp nhất các phần thưởng từ cả config và lịch sử
    const allPrizeNames = Array.from(
      new Set([
        ...Object.keys(prizeCountsMap),
        ...prizeConfigs.map((c) => normalizePrizeName(c.name)),
      ]),
    );

    const detailedPrizes = allPrizeNames.map((normalizedName) => {
      const used = prizeCountsMap[normalizedName] ?? 0;
      const matchedConfig = prizeConfigs.find(
        (c) => normalizePrizeName(c.name) === normalizedName,
      );

      const displayName =
        matchedConfig?.name ??
        originalNamesMap[normalizedName] ??
        normalizedName;

      const total = matchedConfig?.quantity
        ? matchedConfig?.quantity + used
        : used;

      const ratio = matchedConfig?.ratio ?? null;

      return {
        name: displayName,
        ratio,
        total,
        used,
        remaining: matchedConfig?.quantity ?? 0,
      };
    });

    // 👉 Tạo workbook Excel
    const workbook = new ExcelJS.Workbook();
    const winnerSheet = workbook.addWorksheet("Danh sách trúng thưởng");
    const prizeSheet = workbook.addWorksheet("Thống kê giải thưởng");

    // Sheet winners
    winnerSheet.columns = [
      { header: "Tên", key: "name", width: 25 },
      { header: "SĐT", key: "phone", width: 20 },
      { header: "Số hợp đồng", key: "licensePlate", width: 20 },
      { header: "Phần thưởng", key: "prize", width: 25 },
      { header: "Ngày tham gia", key: "createdAt", width: 25 },
    ];

    winners.forEach((w) =>
      winnerSheet.addRow({
        name: w.name,
        phone: w.phone,
        licensePlate: w.licensePlate,
        prize: w.prize,
        createdAt: new Date(w.createdAt).toLocaleString("vi-VN"),
      }),
    );

    // Sheet thống kê prize
    prizeSheet.columns = [
      { header: "Phần thưởng", key: "name", width: 25 },
      { header: "Tỉ lệ (%)", key: "ratio", width: 10 },
      { header: "Số lượng ban đầu", key: "total", width: 18 },
      { header: "Đã trúng", key: "used", width: 12 },
      { header: "Còn lại", key: "remaining", width: 12 },
    ];

    detailedPrizes.forEach((p) => prizeSheet.addRow(p));

    // 👉 Xuất file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="winners.xlsx"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: any) {
    console.error("❌ Lỗi khi export Excel:", error);
    return NextResponse.json(
      { error: "Server error", details: String(error) },
      { status: 500 },
    );
  }
}
