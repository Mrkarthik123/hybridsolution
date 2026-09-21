import { NextRequest, NextResponse } from "next/server";
import { getOrders, saveOrders, isAdminRequest, type StoredOrder } from "@/lib/server-db";

// GET /api/orders — admin gets all; shoppers get ?email= or ?id= filtered list
export async function GET(req: NextRequest) {
  const orders = await getOrders();
  if (isAdminRequest(req)) return NextResponse.json({ orders });
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const key = id.trim().toLowerCase();
    return NextResponse.json({ orders: orders.filter((o) => o.id.toLowerCase() === key) });
  }
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ orders: [] });
  const key = email.trim().toLowerCase();
  return NextResponse.json({ orders: orders.filter((o) => (o.email || "").toLowerCase() === key) });
}

// POST /api/orders — record a new order (called by checkout)
export async function POST(req: NextRequest) {
  const o = (await req.json()) as StoredOrder;
  if (!o?.id || !o?.email || !Array.isArray(o?.items) || !o.total) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }
  const orders = await getOrders();
  if (!orders.some((x) => x.id === o.id)) {
    orders.unshift(o);
    await saveOrders(orders);
  }
  return NextResponse.json({ ok: true });
}
