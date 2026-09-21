"use client";
import { useState } from "react";
import { CATEGORIES, inr, type Product } from "../../lib/products";
import { useShop, type Order } from "../../lib/store";

const empty: Product = {
  id: "",
  name: "",
  category: "Microcontrollers",
  price: 499,
  mrp: 699,
  rating: 4.5,
  stock: 50,
  image: "",
  description: "",
  specs: [],
};

export default function AdminPage() {
  const {
    isAdmin, adminLogin, adminLogout,
    products, addProduct, updateProduct, deleteProduct, resetProducts,
    orders, updateOrderStatus,
  } = useShop();
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [form, setForm] = useState<Product>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [tab, setTab] = useState<"products" | "orders">("products");

  if (!isAdmin) {
    return (
      <>
        <h2>Admin login</h2>
        <div style={{ display: "flex", gap: 10, maxWidth: 400 }}>
          <input type="password" placeholder="Admin password" value={pass} onChange={(e) => setPass(e.target.value)} style={{ flex: 1 }} />
          <button
            className="btn"
            onClick={() => {
              if (!adminLogin(pass)) setErr("Wrong password");
              else setErr("");
            }}
          >
            Login
          </button>
        </div>
        {err && <p style={{ color: "#dc2626" }}>{err}</p>}
      </>
    );
  }

  const revenue = orders
    .filter((o) => o.status !== "pending")
    .reduce((s, o) => s + o.total, 0);

  function submit() {
    if (!form.name || !form.id) return alert("ID + Name required");
    if (editing) {
      updateProduct(editing, form);
      setEditing(null);
    } else {
      if (products.some((p) => p.id === form.id)) return alert("ID already exists");
      addProduct({ ...form, specs: form.specs ?? [] });
    }
    setForm(empty);
  }

  // Photo upload: compress in-browser (max 800px JPEG) so it stays small
  // in shared storage and loads fast on all devices
  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return alert("Please choose an image file.");
    if (f.size > 10 * 1024 * 1024) return alert("Image too large (max 10MB).");
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 800;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        setForm((prev) => ({ ...prev, image: dataUrl }));
      };
      img.onerror = () => alert("Could not read that image.");
      img.src = String(reader.result);
    };
    reader.readAsDataURL(f);
    e.target.value = ""; // allow re-picking the same file
  }

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>Admin — HybridSolution</h2>
        <button className="btn ghost" onClick={adminLogout}>Logout admin</button>
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <div className="card" style={{ padding: 12, flex: 1 }}><strong>{products.length}</strong><div style={{ fontSize: 12 }}>Products</div></div>
        <div className="card" style={{ padding: 12, flex: 1 }}><strong>{orders.length}</strong><div style={{ fontSize: 12 }}>Orders</div></div>
        <div className="card" style={{ padding: 12, flex: 1 }}><strong>{inr(revenue)}</strong><div style={{ fontSize: 12 }}>Revenue (paid)</div></div>
      </div>

      <div className="toolbar">
        <button className={tab === "products" ? "btn" : "btn secondary"} onClick={() => setTab("products")}>Products</button>
        <button className={tab === "orders" ? "btn" : "btn secondary"} onClick={() => setTab("orders")}>Orders ({orders.length})</button>
        {tab === "products" && (
          <button className="btn ghost" onClick={() => { if (confirm("Reset to default catalog?")) resetProducts(); }}>
            Reset catalog
          </button>
        )}
      </div>

      {tab === "products" && (
        <>
          <div className="card" style={{ padding: 14, marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>{editing ? `Edit: ${editing}` : "Add product"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input placeholder="id (e.g. esp32-cam)" value={form.id} disabled={!!editing} onChange={(e) => setForm({ ...form, id: e.target.value.trim().toLowerCase().replace(/\s+/g, "-") })} />
              <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
              <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              <input type="number" placeholder="MRP" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })} />
              <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              <input type="number" step="0.1" placeholder="Rating" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700 }}>Product photo</label>
              <div className="row" style={{ marginTop: 6, alignItems: "flex-start" }}>
                {form.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.image} alt="preview" width={120} height={90} style={{ objectFit: "cover", borderRadius: 10, border: "1px solid #e2e8f0" }} />
                ) : (
                  <div style={{ width: 120, height: 90, borderRadius: 10, border: "1px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#5b6b8c" }}>
                    No photo
                  </div>
                )}
                <div>
                  <input type="file" accept="image/*" onChange={onPhoto} />
                  {form.image && (
                    <div style={{ marginTop: 6 }}>
                      <button className="btn ghost" onClick={() => setForm({ ...form, image: "" })}>Remove photo</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} rows={2} />
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn" onClick={submit}>{editing ? "Save" : "Add product"}</button>
              {editing && <button className="btn ghost" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}
            </div>
          </div>

          <table className="table">
            <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th></th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong><br /><span style={{ fontSize: 12, color: "#5b6b8c" }}>{p.id} · {p.category}</span></td>
                  <td>{inr(p.price)}</td>
                  <td>
                    <div className="row">
                      <button className="btn ghost" onClick={() => updateProduct(p.id, { stock: Math.max(0, p.stock - 1) })}>−</button>
                      {p.stock}
                      <button className="btn ghost" onClick={() => updateProduct(p.id, { stock: p.stock + 1 })}>+</button>
                    </div>
                  </td>
                  <td>
                    <div className="row">
                      <button className="btn secondary" onClick={() => { setEditing(p.id); setForm(p); }}>Edit</button>
                      <button className="btn ghost" onClick={() => { if (confirm(`Delete ${p.name}?`)) deleteProduct(p.id); }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === "orders" && (
        <>
          {orders.length === 0 && <p>No orders yet.</p>}
          {orders.map((o: Order) => (
            <div key={o.id} className="card" style={{ padding: 14, marginBottom: 10 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{o.id}</strong>
                <select value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value as Order["status"])}>
                  <option value="pending">pending</option>
                  <option value="paid">paid</option>
                  <option value="mock-paid">mock-paid</option>
                </select>
              </div>
              <div style={{ fontSize: 13, color: "#5b6b8c" }}>{new Date(o.date).toLocaleString()} · {o.email} · {inr(o.total)}{o.paymentMethod ? ` · ${o.paymentMethod}` : ""}{o.utr ? ` · UTR ${o.utr}` : ""}</div>
              {o.address && (
                <div style={{ fontSize: 13, background: "#f1f5f9", borderRadius: 8, padding: "8px 10px", marginTop: 6 }}>
                  📍 <strong>{o.address.name}</strong> · {o.address.phone}<br />
                  {o.address.line}, {o.address.city} — {o.address.pincode}
                </div>
              )}
              <ul style={{ fontSize: 14, margin: "8px 0" }}>
                {o.items.map((i) => <li key={i.id}>{i.name} × {i.qty} — {inr(i.price * i.qty)}</li>)}
              </ul>
            </div>
          ))}
        </>
      )}
    </>
  );
}
