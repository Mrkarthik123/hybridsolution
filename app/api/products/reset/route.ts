import { NextRequest, NextResponse } from "next/server";
import { saveProducts, isAdminRequest } from "@/lib/server-db";
import { PRODUCTS as DEFAULT_PRODUCTS } from "@/lib/products";

// POST /api/products/reset — admin restores the default catalog
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Admin only" }, { status: 401 });
  }
  await saveProducts(DEFAULT_PRODUCTS);
  return NextResponse.json({ ok: true, products: DEFAULT_PRODUCTS });
}
