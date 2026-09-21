"use client";
import { useState } from "react";
import Link from "next/link";
import { useShop } from "../lib/store";

export default function NavBar() {
  const { count, user, logout, isAdmin } = useShop();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <div className="links">
        <Link href="/" className="hide-m">Catalog</Link>
        <Link href="/orders" className="hide-m">Orders</Link>
        <Link href="/admin" className="hide-m">{isAdmin ? "Admin ●" : "Admin"}</Link>
        <Link href="/cart">Cart<span key={count} className="badge pop">{count}</span></Link>
        {user ? (
          <>
            <span className="hide-m">Hi, {user.name}</span>
            <button className="btn ghost hide-m" onClick={logout}>Logout</button>
          </>
        ) : (
          <Link href="/login" className="btn secondary hide-m">Login</Link>
        )}
        <button className="btn ghost menu-btn" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? "✕" : "☰"}
        </button>
      </div>
      {open && (
        <div className="mobile-menu">
          <Link href="/" onClick={close}>🏠 Catalog</Link>
          <Link href="/orders" onClick={close}>🧾 My Purchases</Link>
          <Link href="/cart" onClick={close}>🛒 Cart ({count})</Link>
          <Link href="/admin" onClick={close}>⚙️ Admin{isAdmin ? " ●" : ""}</Link>
          {user ? (
            <>
              <span className="mobile-user">Hi, {user.name} ({user.email})</span>
              <button className="btn ghost" onClick={() => { logout(); close(); }}>Logout</button>
            </>
          ) : (
            <Link href="/login" className="btn secondary" onClick={close}>Login</Link>
          )}
        </div>
      )}
    </>
  );
}
