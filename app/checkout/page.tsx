"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { inr } from "../../lib/products";
import { productById, useShop, type Address } from "../../lib/store";

const MERCHANT_UPI = process.env.NEXT_PUBLIC_MERCHANT_UPI || "mrslogen123@oksbi";
const MERCHANT_PHONE = process.env.NEXT_PUBLIC_MERCHANT_PHONE || "9633434839";
const MERCHANT_NAME = process.env.NEXT_PUBLIC_MERCHANT_NAME || "HybridSolution";

function loadAddress(fallbackName: string): Address {
  try {
    const raw = localStorage.getItem("hs_address");
    if (raw) return JSON.parse(raw) as Address;
  } catch {}
  return { name: fallbackName, phone: "", line: "", city: "", pincode: "" };
}

export default function CheckoutPage() {
  const { cart, user, clear, addOrder, products } = useShop();
  const router = useRouter();
  const [email, setEmail] = useState(user?.email ?? "");
  const [addr, setAddr] = useState<Address>(() =>
    typeof window === "undefined"
      ? { name: "", phone: "", line: "", city: "", pincode: "" }
      : loadAddress(user?.name ?? "")
  );
  const [error, setError] = useState("");
  const [utr, setUtr] = useState("");
  const [copied, setCopied] = useState(false);

  const detailed = cart
    .map((i) => ({ ...i, p: productById(products, i.id)! }))
    .filter((i) => i.p);
  const total = detailed.reduce((s, i) => s + i.p.price * i.qty, 0);

  const upiLink = useMemo(() => {
    const params = new URLSearchParams({
      pa: MERCHANT_UPI,
      pn: MERCHANT_NAME,
      am: total.toFixed(2),
      cu: "INR",
      tn: "HybridSolution order",
    });
    return `upi://pay?${params.toString()}`;
  }, [total]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;

  function checkDetails(): string | null {
    if (!email.includes("@")) return "Enter a valid email for receipt.";
    if (detailed.length === 0) return "Cart is empty.";
    if (!addr.name.trim()) return "Enter the receiver's name.";
    if (!/^[6-9]\d{9}$/.test(addr.phone.trim())) return "Enter a valid 10-digit mobile number.";
    if (!addr.line.trim()) return "Enter the delivery address.";
    if (!addr.city.trim()) return "Enter the city.";
    if (!/^\d{6}$/.test(addr.pincode.trim())) return "Enter a valid 6-digit pincode.";
    try {
      localStorage.setItem("hs_address", JSON.stringify(addr));
    } catch {}
    return null;
  }

  function payUpi() {
    setError("");
    const problem = checkDetails();
    if (problem) return setError(problem);
    if (utr.trim().length < 6) return setError("Enter the 12-digit UPI Ref / UTR number from GPay / PhonePe / Paytm after paying.");
    const orderId = "HS-UPI-" + Date.now().toString(36).toUpperCase();
    addOrder({
      id: orderId,
      email,
      address: addr,
      items: detailed.map((i) => ({ id: i.id, name: i.p.name, price: i.p.price, qty: i.qty })),
      total,
      status: "paid",
      date: new Date().toISOString(),
      paymentMethod: "upi",
      utr: utr.trim(),
    });
    clear();
    router.push(`/success?order=${orderId}`);
  }

  return (
    <>
      <h2>Checkout — Pay via UPI 📱</h2>
      <p>Total payable: <strong>{inr(total)}</strong></p>

      <div style={{ maxWidth: 480, marginBottom: 12 }}>
        <input placeholder="Email for receipt" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />
      </div>

      <div className="card" style={{ padding: 16, maxWidth: 520, marginBottom: 12 }}>
        <h3 style={{ margin: "0 0 8px" }}>📍 Delivery address</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input placeholder="Full name" value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} />
          <input placeholder="Mobile (10-digit)" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} />
        </div>
        <textarea placeholder="House no, street, area" value={addr.line} onChange={(e) => setAddr({ ...addr, line: e.target.value })} rows={2} style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
          <input placeholder="City" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
          <input placeholder="Pincode (6-digit)" value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} />
        </div>
      </div>

      <div className="card" style={{ padding: 16, maxWidth: 520 }}>
        <h3 style={{ margin: "0 0 8px" }}>Pay to {MERCHANT_PHONE} via UPI</h3>
        <p style={{ fontSize: 14, margin: "0 0 8px" }}>
          Scan the QR with <strong>GPay / PhonePe / Paytm</strong> or pay to UPI ID{" "}
          <code>{MERCHANT_UPI}</code>
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="UPI QR" width={220} height={220} style={{ border: "1px solid #e2e8f0", borderRadius: 12 }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14 }}>Amount: <strong>{inr(total)}</strong></div>
            <div style={{ fontSize: 14 }}>UPI ID: <code>{MERCHANT_UPI}</code></div>
            <div style={{ fontSize: 14 }}>Phone: <strong>{MERCHANT_PHONE}</strong></div>
            <div className="row" style={{ marginTop: 8 }}>
              <a className="btn" href={upiLink}>Open UPI app</a>
              <button
                className="btn secondary"
                onClick={() => {
                  navigator.clipboard?.writeText(MERCHANT_UPI);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? "Copied!" : "Copy UPI ID"}
              </button>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 13 }}>Step 2 — paste UPI Ref / UTR number after payment:</label>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input placeholder="e.g. 412345678901" value={utr} onChange={(e) => setUtr(e.target.value)} style={{ flex: 1 }} />
            <button className="btn" onClick={payUpi}>I have paid →</button>
          </div>
        </div>
      </div>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      <p style={{ color: "#5b6b8c", fontSize: 13 }}>
        💡 UPI Direct = money goes straight to <strong>{MERCHANT_UPI}</strong>. No commission. Verify payments in GPay/PhonePe history matched against the UTR in Admin → Orders.
      </p>
    </>
  );
}
