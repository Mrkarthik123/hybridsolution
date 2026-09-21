"use client";
import Link from "next/link";
import { inr } from "../../lib/products";
import { productById, useShop } from "../../lib/store";

export default function CartPage() {
  const { cart, setQty, remove, clear, products } = useShop();
  const detailed = cart
    .map((i) => ({ ...i, p: productById(products, i.id)! }))
    .filter((i) => i.p);
  const total = detailed.reduce((s, i) => s + i.p.price * i.qty, 0);

  if (detailed.length === 0)
    return (
      <>
        <h2>Your cart is empty</h2>
        <Link href="/" className="btn">Browse parts</Link>
      </>
    );

  return (
    <>
      <h2>Cart ({detailed.length} items)</h2>
      <table className="table">
        <thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead>
        <tbody>
          {detailed.map((i) => (
            <tr key={i.id}>
              <td>{i.p.name}</td>
              <td>{inr(i.p.price)}</td>
              <td>
                <div className="row">
                  <button className="btn ghost" onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                  <span>{i.qty}</span>
                  <button className="btn ghost" onClick={() => setQty(i.id, i.qty + 1)}>+</button>
                </div>
              </td>
              <td>{inr(i.p.price * i.qty)}</td>
              <td><button className="btn ghost" onClick={() => remove(i.id)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row" style={{ justifyContent: "space-between", marginTop: 16 }}>
        <button className="btn ghost" onClick={clear}>Clear cart</button>
        <div className="row"><strong>Total: {inr(total)}</strong>
          <Link href="/checkout" className="btn">Checkout →</Link>
        </div>
      </div>
    </>
  );
}
