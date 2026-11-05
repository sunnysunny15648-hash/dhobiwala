import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Circle,
  PackageCheck,
  Shirt,
  Star,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const milestones = [
  "placed",
  "pickup_scheduled",
  "collected",
  "washing",
  "quality_check",
  "ready_for_delivery",
  "out_for_delivery",
  "delivered",
];
const pretty = (text) =>
  String(text || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [params] = useSearchParams();
  useEffect(() => {
    api
      .get("/orders")
      .then(({ data }) => setOrders(data.orders || []))
      .catch((err) => setError(err.message));
  }, []);
  async function cancelOrder(order) {
    if (!window.confirm(`Cancel order ${order.order_number}?`)) return;
    try {
      await api.put(`/orders/${order.id}/cancel`);
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, order_status: "cancelled" } : item,
        ),
      );
      toast.success("Order cancelled.");
    } catch (err) {
      toast.error(err.message);
    }
  }
  async function reviewOrder(order) {
    const rating = Number(
      window.prompt("Rate your laundry care from 1 to 5", "5"),
    );
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;
    const comment =
      window.prompt("Share a note about your experience", "") || "";
    try {
      await api.post("/reviews", { order_id: order.id, rating, comment });
      toast.success("Thank you for sharing your feedback.");
    } catch (err) {
      toast.error(err.message);
    }
  }
  const selected = orders.find(
    (order) =>
      order.id === params.get("order") ||
      order.order_number === params.get("new"),
  );
  return (
    <div className="history-page">
      {params.get("new") && (
        <div className="booking-success">
          <span>
            <Check size={19} />
          </span>
          <div>
            <b>Your pickup is booked.</b>
            <small>Order {params.get("new")} is now in our hands.</small>
          </div>
        </div>
      )}
      {error && (
        <div className="connection-note">
          <b>Couldn’t load your order history.</b>
          <p>{error}</p>
        </div>
      )}
      {selected && (
        <section className="tracking-panel">
          <div className="tracking-top">
            <div>
              <span className="eyebrow">ORDER TRACKING</span>
              <h2>{selected.order_number}</h2>
            </div>
            <span className={`order-status status-${selected.order_status}`}>
              {pretty(selected.order_status)}
            </span>
          </div>
          <div className="tracking-progress">
            {milestones.map((stage, index) => {
              const current = milestones.indexOf(selected.order_status);
              const done = index <= current;
              return (
                <div
                  className={`tracking-step ${done ? "done" : ""}`}
                  key={stage}
                >
                  <span>
                    {done ? <Check size={12} /> : <Circle size={10} />}
                  </span>
                  <small>{pretty(stage)}</small>
                </div>
              );
            })}
          </div>
          <div className="tracking-details">
            <div>
              <small>PICKUP</small>
              <b>
                {selected.pickup_date} · {selected.pickup_slot}
              </b>
            </div>
            <div>
              <small>PAYMENT</small>
              <b>{pretty(selected.payment_status)}</b>
            </div>
            <div>
              <small>ESTIMATE</small>
              <b>₹{selected.total_amount}</b>
            </div>
          </div>
        </section>
      )}
      {orders.length ? (
        <div className="history-list">
          {orders.map((order) => (
            <article className="history-order" key={order.id}>
              <div className="history-order-icon">
                <Shirt size={20} />
              </div>
              <div className="history-order-main">
                <div className="history-order-head">
                  <b>{order.order_number}</b>
                  <span className={`order-status status-${order.order_status}`}>
                    {pretty(order.order_status)}
                  </span>
                </div>
                <p>
                  {order.service?.name || "Laundry care"} ·{" "}
                  {new Date(order.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <small>
                  {order.items?.length || 0} clothing categories · ₹
                  {order.total_amount}
                </small>
              </div>
              <Link
                to={`/account/orders?order=${order.id}`}
                className="history-view"
              >
                View details <ArrowUpRight size={15} />
              </Link>
              {order.order_status === "delivered" && (
                <button
                  className="history-action"
                  onClick={() => reviewOrder(order)}
                  title="Review this order"
                >
                  <Star size={15} />
                </button>
              )}
              {["placed", "pickup_scheduled"].includes(order.order_status) && (
                <button
                  className="history-action"
                  onClick={() => cancelOrder(order)}
                  title="Cancel this order"
                >
                  <X size={15} />
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        !error && (
          <div className="empty-orders">
            <PackageCheck size={28} />
            <h3>Your story starts with a pickup.</h3>
            <p>Once you book, your laundry updates will live here.</p>
            <Link className="button button-dark button-small" to="/book">
              Book a pickup <ArrowUpRight size={15} />
            </Link>
          </div>
        )
      )}
    </div>
  );
}
