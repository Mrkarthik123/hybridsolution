import { NextRequest, NextResponse } from "next/server";
import { getProducts, saveProducts, isAdminRequest } from "@/lib/server-db";

// PUT /api/products/[id] — admin edits a product
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Admin only" }, { status: 401 });
  }
  const patch = await req.json();
  const products = await getProducts();
  if (!products.some((p) => p.id === params.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const updated = products.map((p) => (p.id === params.id ? { ...p, ...patch, id: p.id } : p));
  await saveProducts(updated);
  return NextResponse.json({ ok: true, products: updated });
}

// DELETE /api/products/[id] — admin deletes a product
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Admin only" }, { status: 401 });
  }
  const products = await getProducts();
  const updated = products.filter((p) => p.id !== params.id);
  await saveProducts(updated);
  return NextResponse.json({ ok: true, products: updated });
}
