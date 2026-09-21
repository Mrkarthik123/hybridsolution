import type { Metadata } from "next";
import "./globals.css";
import { ShopProvider } from "../lib/store";
import Link from "next/link";
import NavBar from "./nav";
import CartToast from "./toast";

export const metadata: Metadata = {
  title: "HybridSolution — Electronic Parts Store",
  description:
    "Buy Arduino, ESP32, sensors, power modules & tools online in India. Direct UPI payments, fast delivery.",
  keywords: ["HybridSolution", "electronic parts", "Arduino", "ESP32", "sensors", "India"],
  openGraph: {
    title: "HybridSolution — Electronic Parts Store",
    description: "Arduino, ESP32, sensors & tools with direct UPI payments.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ShopProvider>
          <div className="nav">
            <div className="nav-inner">
              <Link href="/" className="logo">
                ⚡ Hybrid<span>Solution</span>
              </Link>
              <NavBar />
            </div>
          </div>
          <div className="container">{children}</div>
          <CartToast />
        </ShopProvider>
      </body>
    </html>
  );
}
