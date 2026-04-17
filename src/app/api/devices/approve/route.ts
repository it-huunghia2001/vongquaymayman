/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "../../admin/prizes/route";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  if (!requireAdmin()) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  try {
    const { id, status } = await req.json(); // action: 'APPROVED' hoặc 'REJECTED'
    const updated = await prisma.deviceRequest.update({
      where: { id },
      data: { status: status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi phê duyệt" }, { status: 500 });
  }
}
