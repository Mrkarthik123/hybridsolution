import { NextRequest, NextResponse } from "next/server";
import { getOrders, saveOrders, isAdminRequest } from "@/lib/server-db";

// PATCH /api/orders/[id] — admin updates order status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Admin only" }, { status: 401 });
  }
  const { status } = (await req.json()) as { status: "paid" | "mock-paid" | "pending" };
  if (!["paid", "mock-paid", "pending"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const orders = await getOrders();
  const updated = orders.map((o) => (o.id === params.id ? { ...o, status } : o));
  await saveOrders(updated);
  return NextResponse.json({ ok: true });
}
