"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "../../lib/store";

export default function LoginPage() {
  const { login } = useShop();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();
  return (
    <>
      <h2>Login / Signup</h2>
      <p style={{ color: "#5b6b8c", fontSize: 14 }}>Demo auth — stored locally, used for receipts & order history.</p>
      <div style={{ display: "flex", gap: 10, maxWidth: 480, flexWrap: "wrap" }}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button
          className="btn"
          onClick={() => {
            if (!name || !email.includes("@")) return alert("Enter name + valid email");
            login(name, email);
            router.push("/");
          }}
        >
          Continue
        </button>
      </div>
    </>
  );
}
