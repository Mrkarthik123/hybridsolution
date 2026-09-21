"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function Inner() {
  const params = useSearchParams();
  const order = params.get("order");

  return (
    <div className="success-box">
      <h2>✅ Payment successful!</h2>
      <p>Order ID: <code>{order ?? "—"}</code></p>
      <p style={{ color: "#15803d" }}>
        Receipt sent. Track it under <Link href="/orders" style={{ textDecoration: "underline" }}>My Purchases</Link>.
      </p>
      <Link href="/" className="btn">Continue shopping</Link>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense><Inner /></Suspense>
  );
}
