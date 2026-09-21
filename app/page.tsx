"use client";
import { useMemo, useRef, useState } from "react";
import { CATEGORIES, inr } from "../lib/products";
import { useShop } from "../lib/store";

export default function Home() {
  const { add, products } = useShop();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [sort, setSort] = useState("pop");
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function addWithEffect(id: string) {
    add(id);
    setJustAdded(id);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustAdded(null), 1200);
  }

  const list = useMemo(() => {
    let l = products.filter(
      (p) =>
        (cat === "All" || p.category === cat) &&
        (p.name + p.description).toLowerCase().includes(q.toLowerCase())
    );
    if (sort === "low") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "high") l = [...l].sort((a, b) => b.price - a.price);
    if (sort === "rating") l = [...l].sort((a, b) => b.rating - a.rating);
    return l;
  }, [q, cat, sort, products]);

  return (
    <>
      <div className="hero">
        <h1 style={{ margin: "0 0 8px" }}>HybridSolution — Electronic parts ⚡</h1>
        <p style={{ color: "#5b6b8c", margin: 0 }}>
          Arduino, ESP32, sensors, power modules & tools. Pay direct via UPI — no commission.
        </p>
      </div>

      <div className="toolbar">
        <input placeholder="Search parts… (e.g. ESP32, sensor)" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="pop">Popular</option>
          <option value="low">Price: Low → High</option>
          <option value="high">Price: High → Low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      <div className="grid">
        {list.map((p) => (
          <div key={p.id} className="card">
            <img src={p.image} alt={p.name} loading="lazy" onError={(e) => ((e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=" + encodeURIComponent(p.name))} />
            <div className="card-body">
              <div className="cat">{p.category} · ★ {p.rating}</div>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 13, color: "#5b6b8c" }}>{p.description}</div>
              <div className="price-row">
                <span className="price">{inr(p.price)}</span>
                <span className="mrp">{inr(p.mrp)}</span>
                <span style={{ fontSize: 12, color: "#22c55e" }}>{p.stock} in stock</span>
              </div>
              <button className="btn" onClick={() => addWithEffect(p.id)}>
                {justAdded === p.id ? "✓ Added!" : "Add to bag"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {list.length === 0 && <p>No parts match your search.</p>}
    </>
  );
}
