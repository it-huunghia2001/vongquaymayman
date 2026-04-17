import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const prizes = await prisma.prizeConfig.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(prizes);
}

export async function POST(req: Request) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { name, ratio, quantity } = await req.json();
  if (!name || !ratio || quantity == null) {
    return NextResponse.json({ error: "Thiếu dữ liệu" }, { status: 400 });
  }

  const prize = await prisma.prizeConfig.create({
    data: {
      name,
      ratio: parseFloat(ratio),
      quantity: parseInt(quantity, 10),
      remaining: parseInt(quantity, 10),
    },
  });

  return NextResponse.json(prize);
}

export async function PUT(req: Request) {
  if (!requireAdmin()) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { id, name, ratio, quantity } = await req.json();
  if (!id || !name || ratio == null || quantity == null) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  }

  const prize = await prisma.prizeConfig.update({
    where: { id },
    data: {
      name,
      ratio: parseFloat(ratio),
      quantity: parseInt(quantity, 10),
      remaining: parseInt(quantity, 10),
    },
  });

  return NextResponse.json(prize);
}

export async function DELETE(req: Request) {
  if (!requireAdmin()) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Thiếu ID" }, { status: 400 });
  }

  await prisma.prizeConfig.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
