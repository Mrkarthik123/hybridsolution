"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useShop } from "../lib/store";

export default function CartToast() {
  const { toast, clearToast } = useShop();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 2200);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;
  return (
    <Link href="/cart" className="toast" onClick={clearToast}>
      <span className="tick">✓</span>
      <span>{toast.msg} — view bag</span>
    </Link>
  );
}
