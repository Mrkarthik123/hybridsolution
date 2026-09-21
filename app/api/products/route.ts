import { NextRequest, NextResponse } from "next/server";
import { getProducts, saveProducts, isAdminRequest } from "@/lib/server-db";
import type { Product } from "@/lib/products";

// GET /api/products — public catalog (shared across all devices)
export async function GET() {
  const products = await getProducts();
  return NextResponse.json({ products });
}

// POST /api/products — admin adds a product (needs x-admin-password header)
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Admin only" }, { status: 401 });
  }
  const p = (await req.json()) as Product;
  if (!p?.id || !p?.name) {
    return NextResponse.json({ error: "id and name required" }, { status: 400 });
  }
  const products = await getProducts();
  if (products.some((x) => x.id === p.id)) {
    return NextResponse.json({ error: "ID already exists" }, { status: 409 });
  }
  const updated = [p, ...products];
  await saveProducts(updated);
  return NextResponse.json({ ok: true, products: updated });
}
