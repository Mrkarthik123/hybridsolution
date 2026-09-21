"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "./products";
import { PRODUCTS as DEFAULT_PRODUCTS } from "./products";

export type CartItem = { id: string; qty: number };
export type Address = {
  name: string;
  phone: string;
  line: string;
  city: string;
  pincode: string;
};
export type Order = {
  id: string;
  email: string;
  address?: Address;
  items: { id: string; name: string; price: number; qty: number }[];
  total: number;
  status: "paid" | "mock-paid" | "pending";
  date: string;
  stripeSessionId?: string;
  paymentMethod?: "stripe" | "upi";
  utr?: string;
};

type ShopState = {
  cart: CartItem[];
  add: (id: string) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  user: { name: string; email: string } | null;
  login: (name: string, email: string) => void;
  logout: () => void;
  orders: Order[];
  addOrder: (o: Order) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  toast: { id: number; msg: string } | null;
  clearToast: () => void;
  products: Product[];
  addProduct: (p: Product) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  resetProducts: () => void;
  isAdmin: boolean;
  adminLogin: (pass: string) => boolean;
  adminLogout: () => void;
};

const Ctx = createContext<ShopState | null>(null);
export const ADMIN_PASSWORD = "megha123";
const ADMIN_PW_KEY = "hs_admin_pw_v2"; // bumped: old admin123 sessions are invalidated

function load<T>(k: string, fb: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fb;
  } catch {
    return fb;
  }
}

function adminHeaders(): HeadersInit {
  try {
    const pw = localStorage.getItem(ADMIN_PW_KEY);
    return pw ? { "Content-Type": "application/json", "x-admin-password": pw } : { "Content-Type": "application/json" };
  } catch {
    return { "Content-Type": "application/json" };
  }
}

// fire-and-forget server sync (UI updates optimistically first)
// returns the fetch promise so callers can reconcile with server truth after
function sync(url: string, opts?: RequestInit): Promise<unknown> {
  return fetch(url, opts).catch(() => null);
}

function mergeById<T extends { id: string }>(server: T[], local: T[]): T[] {
  const map = new Map<string, T>();
  for (const o of local) map.set(o.id, o);
  for (const o of server) map.set(o.id, o); // server wins on conflict
  return Array.from(map.values()).sort((a: any, b: any) =>
    String(b.date ?? "").localeCompare(String(a.date ?? ""))
  );
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);
  const [ready, setReady] = useState(false);

  // Initial load: cart/user/admin from this browser, products+orders from the SHARED server
  useEffect(() => {
    setCart(load("eh_cart", []));
    setUser(load("eh_user", null));
    // An admin session is only valid if we also stored its password
    // (sessions from before the multi-device update have the flag but no password,
    //  so their edits were rejected with 401 and reverted — force a fresh login)
    let pw: string | null = null;
    try {
      pw = localStorage.getItem(ADMIN_PW_KEY);
    } catch {}
    const adminFlag = load("hs_admin", false);
    if (adminFlag && !pw) {
      setIsAdmin(false);
      try {
        localStorage.removeItem("hs_admin");
      } catch {}
    } else {
      setIsAdmin(adminFlag);
    }
    setReady(true);

    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        if (d?.products?.length) setProducts(d.products);
      })
      .catch(() => setProducts(load("hs_products", DEFAULT_PRODUCTS)));

    setOrders(load("eh_orders", [])); // local cache first, server merge below
  }, []);

  // Merge server orders (shared across devices) with local cache
  useEffect(() => {
    if (!ready) return;
    const url = isAdmin ? "/api/orders" : user?.email ? `/api/orders?email=${encodeURIComponent(user.email)}` : null;
    if (!url) return;
    fetch(url, { headers: adminHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.orders)) {
          setOrders((prev) => mergeById(d.orders, prev));
        }
      })
      .catch(() => {});
  }, [ready, isAdmin, user?.email]);

  // Live-refresh shared catalog every 20s so other devices' edits appear
  useEffect(() => {
    if (!ready) return;
    const t = setInterval(() => {
      fetch("/api/products")
        .then((r) => r.json())
        .then((d) => {
          if (d?.products?.length) {
            setProducts((prev) =>
              JSON.stringify(prev) === JSON.stringify(d.products) ? prev : d.products
            );
          }
        })
        .catch(() => {});
    }, 20000);
    return () => clearInterval(t);
  }, [ready]);

  useEffect(() => {
    if (ready) localStorage.setItem("eh_cart", JSON.stringify(cart));
  }, [cart, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem("eh_user", JSON.stringify(user));
  }, [user, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem("eh_orders", JSON.stringify(orders));
  }, [orders, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem("hs_admin", JSON.stringify(isAdmin));
  }, [isAdmin, ready]);

  const val = useMemo<ShopState>(
    () => ({
      cart,
      add: (id) => {
        setCart((c) => {
          const f = c.find((i) => i.id === id);
          return f
            ? c.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i))
            : [...c, { id, qty: 1 }];
        });
        const name = products.find((p) => p.id === id)?.name ?? "Item";
        setToast({ id: Date.now(), msg: `${name} added to bag` });
      },
      remove: (id) => setCart((c) => c.filter((i) => i.id !== id)),
      setQty: (id, qty) =>
        setCart((c) =>
          qty <= 0 ? c.filter((i) => i.id !== id) : c.map((i) => (i.id === id ? { ...i, qty } : i))
        ),
      clear: () => setCart([]),
      count: cart.reduce((s, i) => s + i.qty, 0),
      user,
      login: (name, email) => setUser({ name, email }),
      logout: () => setUser(null),
      orders,
      toast,
      clearToast: () => setToast(null),
      addOrder: (o) => {
        setOrders((p) => (p.some((x) => x.id === o.id) ? p : [o, ...p]));
        try {
          localStorage.setItem("hs_last_email", o.email);
        } catch {}
        sync("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) });
      },
      updateOrderStatus: (id, status) => {
        setOrders((p) => p.map((o) => (o.id === id ? { ...o, status } : o)));
        sync(`/api/orders/${id}`, { method: "PATCH", headers: adminHeaders(), body: JSON.stringify({ status }) });
      },
      products,
      addProduct: (p) => {
        setProducts((prev) => (prev.some((x) => x.id === p.id) ? prev : [p, ...prev]));
        // reconcile with server truth once saved (prevents stale reverts)
        sync("/api/products", { method: "POST", headers: adminHeaders(), body: JSON.stringify(p) }).then(() =>
          fetch("/api/products").then((r) => r.json()).then((d) => {
            if (d?.products?.length) setProducts(d.products);
          }).catch(() => {})
        );
      },
      updateProduct: (id, patch) => {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
        // reconcile with server truth once saved (prevents stale reverts)
        sync(`/api/products/${id}`, { method: "PUT", headers: adminHeaders(), body: JSON.stringify(patch) }).then(() =>
          fetch("/api/products").then((r) => r.json()).then((d) => {
            if (d?.products?.length) setProducts(d.products);
          }).catch(() => {})
        );
      },
      deleteProduct: (id) => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setCart((c) => c.filter((i) => i.id !== id));
        sync(`/api/products/${id}`, { method: "DELETE", headers: adminHeaders() }).then(() =>
          fetch("/api/products").then((r) => r.json()).then((d) => {
            if (d?.products?.length) setProducts(d.products);
          }).catch(() => {})
        );
      },
      resetProducts: () => {
        setProducts(DEFAULT_PRODUCTS);
        sync("/api/products/reset", { method: "POST", headers: adminHeaders() }).then(() =>
          fetch("/api/products").then((r) => r.json()).then((d) => {
            if (d?.products?.length) setProducts(d.products);
          }).catch(() => {})
        );
      },
      isAdmin,
      adminLogin: (pass) => {
        const ok = pass === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ADMIN_PASSWORD);
        setIsAdmin(ok);
        try {
          if (ok) localStorage.setItem(ADMIN_PW_KEY, pass);
          else localStorage.removeItem(ADMIN_PW_KEY);
        } catch {}
        return ok;
      },
      adminLogout: () => {
        setIsAdmin(false);
        try {
          localStorage.removeItem(ADMIN_PW_KEY);
        } catch {}
      },
    }),
    [cart, user, orders, products, isAdmin, toast]
  );

  return <Ctx.Provider value={val}>{children}</Ctx.Provider>;
}

export function useShop() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useShop outside provider");
  return v;
}

export function productById(list: Product[], id: string) {
  return list.find((p) => p.id === id);
}
