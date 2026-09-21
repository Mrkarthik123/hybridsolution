import { promises as fs } from "fs";
import path from "path";
import { PRODUCTS as DEFAULT_PRODUCTS, type Product } from "./products";

export type StoredOrder = {
  id: string;
  email: string;
  address?: {
    name: string;
    phone: string;
    line: string;
    city: string;
    pincode: string;
  };
  items: { id: string; name: string; price: number; qty: number }[];
  total: number;
  status: "paid" | "mock-paid" | "pending";
  date: string;
  stripeSessionId?: string;
  paymentMethod?: "stripe" | "upi";
  utr?: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

// In-memory fallback (used when the filesystem is read-only, e.g. free serverless hosting)
let memProducts: Product[] | null = null;
let memOrders: StoredOrder[] | null = null;

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

export function isAdminRequest(req: Request): boolean {
  const pw = req.headers.get("x-admin-password") || "";
  return pw !== "" && pw === (process.env.ADMIN_PASSWORD || "megha123");
}

// ---- Products (shared across all devices) ----
export async function getProducts(): Promise<Product[]> {
  try {
    await ensureDir();
    const existing = await readJson<Product[] | null>(PRODUCTS_FILE, null);
    if (existing && Array.isArray(existing) && existing.length > 0) {
      memProducts = existing;
      return existing;
    }
    await writeJson(PRODUCTS_FILE, DEFAULT_PRODUCTS);
    memProducts = DEFAULT_PRODUCTS;
    return DEFAULT_PRODUCTS;
  } catch {
    if (!memProducts) memProducts = DEFAULT_PRODUCTS;
    return memProducts;
  }
}

export async function saveProducts(products: Product[]) {
  memProducts = products;
  try {
    await writeJson(PRODUCTS_FILE, products);
  } catch {
    /* read-only filesystem (serverless) — memory copy keeps serving */
  }
}

// ---- Orders (shared across all devices) ----
export async function getOrders(): Promise<StoredOrder[]> {
  try {
    const orders = await readJson<StoredOrder[]>(ORDERS_FILE, []);
    const list = Array.isArray(orders) ? orders : [];
    memOrders = list;
    return list;
  } catch {
    if (!memOrders) memOrders = [];
    return memOrders;
  }
}

export async function saveOrders(orders: StoredOrder[]) {
  memOrders = orders.slice(0, 1000);
  try {
    await writeJson(ORDERS_FILE, memOrders);
  } catch {
    /* read-only filesystem (serverless) — memory copy keeps serving */
  }
}
