"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { inr } from "../../lib/products";
import { productById, useShop, type Order } from "../../lib/store";

function OrdersInner() {
  const { orders, user, add, products } = useShop();
  const router = useRouter();
  const params = useSearchParams();
  const [lookup, setLookup] = useState("");
  const [searched, setSearched] = useState<string | null>(null);
  const [remote, setRemote] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Returning guest? auto-search the email used for their last order on this browser.
  // Also supports direct links: /orders?email=x or /orders?id=HS-XXX (no typing needed)
  useEffect(() => {
    if (searched) return;
    const urlQ = params.get("email") || params.get("id") || "";
    if (urlQ.trim()) {
      setLookup(urlQ.trim());
      doSearch(urlQ.trim());
      return;
    }
    if (user?.email) return;
    try {
      const last = localStorage.getItem("hs_last_email");
      if (last) {
        setLookup(last);
        doSearch(last);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  function doSearch(raw: string) {
    const q = raw.trim();
    if (!q) return;
    setSearched(q);
    setLoading(true);
    const url = q.includes("@")
      ? `/api/orders?email=${encodeURIComponent(q)}`
      : `/api/orders?id=${encodeURIComponent(q)}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.orders)) setRemote(d.orders);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function search(e?: React.FormEvent) {
    e?.preventDefault();
    doSearch(lookup);
  }

  const sameEmail = (a?: string, b?: string) =>
    (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();

  const mine = useMemo(() => {
    const seen = new Map<string, Order>();
    const pool = [...remote, ...orders];
    const q = searched?.trim().toLowerCase();
    for (const o of pool) {
      if (seen.has(o.id)) continue;
      // show anything matching the login email OR the searched email/ID
      if (user?.email && sameEmail(o.email, user.email)) seen.set(o.id, o);
      else if (q && (sameEmail(o.email, q) || o.id.toLowerCase() === q)) {
        seen.set(o.id, o);
      }
    }
    return Array.from(seen.values()).sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, remote, user?.email, searched]);

  const paid = mine.filter((o) => o.status !== "pending");
  const spent = paid.reduce((s, o) => s + o.total, 0);
  const itemsBought = paid.reduce((s, o) => s + o.items.reduce((n, i) => n + i.qty, 0), 0);
  const activeLabel = user?.email && searched && !sameEmail(user.email, searched)
    ? `${user.email} + ${searched}`
    : (user?.email ?? searched);

  function reorder(o: Order) {
    let added = 0;
    o.items.forEach((i) => {
      if (productById(products, i.id)) {
        for (let n = 0; n < Math.min(Math.max(1, i.qty), 99); n++) add(i.id);
        added++;
      }
    });
    if (!added) return alert("Those items are no longer in the catalog.");
    router.push("/cart");
  }

  return (
    <>
      <h2>My Purchases {activeLabel ? `— ${activeLabel}` : ""}</h2>

      <div className="card" style={{ padding: 14, marginBottom: 14 }}>
        {user?.email && (
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            Logged in as <strong>{user.email}</strong> · <Link href="/login" style={{ textDecoration: "underline" }}>switch account</Link>
          </div>
        )}
        {!searched ? (
          <form onSubmit={search} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              placeholder="Order email or Order ID (e.g. HS-UPI-…)"
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              style={{ flex: 1, minWidth: 220 }}
              autoComplete="email"
            />
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Looking up…" : "Find my orders"}
            </button>
            {!user?.email && <Link href="/login" className="btn secondary">Login</Link>}
          </form>
        ) : (
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 14 }}>Showing purchases for <strong>{searched}</strong></span>
            <button className="btn ghost" onClick={() => { setSearched(null); setRemote([]); setLookup(""); }}>
              New search
            </button>
          </div>
        )}
      </div>

      {!user?.email && !searched ? (
        <p style={{ color: "#5b6b8c" }}>Enter your order email or order ID above to see your purchase history on any device.</p>
      ) : mine.length === 0 ? (
        <p>
          {loading ? "Searching…" : <>No purchases found for <strong>{user?.email ?? searched}</strong>. Check the spelling or <Link href="/" style={{ textDecoration: "underline" }}>browse parts</Link>.</>}
        </p>
      ) : (
        <>
          <div className="row" style={{ marginBottom: 12 }}>
            <div className="card" style={{ padding: 12, flex: 1 }}><strong>{mine.length}</strong><div style={{ fontSize: 12 }}>Orders</div></div>
            <div className="card" style={{ padding: 12, flex: 1 }}><strong>{itemsBought}</strong><div style={{ fontSize: 12 }}>Items bought</div></div>
            <div className="card" style={{ padding: 12, flex: 1 }}><strong>{inr(spent)}</strong><div style={{ fontSize: 12 }}>Total spent</div></div>
          </div>

          {mine.map((o) => (
            <div key={o.id} className="card" style={{ marginBottom: 12, padding: 14 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong style={{ wordBreak: "break-all" }}>{o.id}</strong>
                <span style={{ fontSize: 12, color: "#fff", background: o.status === "paid" ? "#16a34a" : o.status === "mock-paid" ? "#a16207" : "#475569", padding: "3px 10px", borderRadius: 999 }}>{o.status}</span>
              </div>
              <div style={{ fontSize: 13, color: "#5b6b8c" }}>
                {new Date(o.date).toLocaleString()}
                {o.paymentMethod ? ` · ${o.paymentMethod === "upi" ? "📱 UPI → 9633434839" : "💳 Stripe"}` : ""}
                {o.utr ? ` · UTR ${o.utr}` : ""}
              </div>
              {o.address && (
                <div style={{ fontSize: 13, background: "#f1f5f9", borderRadius: 8, padding: "8px 10px", marginTop: 8 }}>
                  📍 <strong>{o.address.name}</strong> · {o.address.phone}<br />
                  {o.address.line}, {o.address.city} — {o.address.pincode}
                </div>
              )}
              <ul style={{ fontSize: 14 }}>
                {o.items.map((i) => (
                  <li key={i.id}>{i.name} × {i.qty} — {inr(i.price * i.qty)}</li>
                ))}
              </ul>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>Total: {inr(o.total)}</strong>
                <button className="btn secondary" onClick={() => reorder(o)}>Buy again</button>
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersInner />
    </Suspense>
  );
}
