import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID thiết bị" }, { status: 400 });
    }

    await prisma.deviceRequest.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Xóa thiết bị thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa thiết bị:", error);
    return NextResponse.json(
      { error: "Không thể xóa thiết bị" },
      { status: 500 },
    );
  }
}
