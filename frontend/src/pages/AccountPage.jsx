import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Clock3,
  PackageCheck,
  Shirt,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const statusLabel = (value) => String(value || "placed").replaceAll("_", " ");
export default function AccountPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/orders")
      .then(({ data }) => setOrders(data.orders || []))
      .catch((err) => setError(err.message));
  }, []);
  const active = orders.filter(
    (order) => !["delivered", "cancelled"].includes(order.order_status),
  );
  const completed = orders.filter(
    (order) => order.order_status === "delivered",
  );
  return (
    <div className="account-page">
      <section className="account-welcome">
        <div>
          <span className="eyebrow">A LITTLE MORE ROOM FOR YOU</span>
          <h2>
            Hello, {user?.full_name?.split(" ")[0] || "there"} <span>✳</span>
          </h2>
          <p>Here’s what’s happening with your laundry.</p>
        </div>
        <div className="welcome-mark">
          <Shirt size={36} strokeWidth={1.3} />
        </div>
      </section>
      <div className="metric-row">
        <article className="metric-card">
          <span className="metric-icon">
            <PackageCheck size={18} />
          </span>
          <span className="metric-label">TOTAL ORDERS</span>
          <b>{orders.length}</b>
          <small>Since you joined</small>
        </article>
        <article className="metric-card metric-card-highlight">
          <span className="metric-icon">
            <Clock3 size={18} />
          </span>
          <span className="metric-label">IN THE WORKS</span>
          <b>{active.length}</b>
          <small>{active.length ? "We’re on it" : "All caught up"}</small>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Shirt size={18} />
          </span>
          <span className="metric-label">FRESHLY RETURNED</span>
          <b>{completed.length}</b>
          <small>Ready to wear again</small>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Wallet size={18} />
          </span>
          <span className="metric-label">PAYMENTS DUE</span>
          <b>
            {
              orders.filter((order) => order.payment_status === "pending")
                .length
            }
          </b>
          <small>Settle on delivery</small>
        </article>
      </div>
      {error && (
        <div className="connection-note">
          <b>Orders are waiting for the live connection.</b>
          <p>
            {error}. Your account is signed in, but order data is available
            after the database is configured.
          </p>
        </div>
      )}
      <section className="orders-section">
        <div className="orders-section-heading">
          <div>
            <span className="eyebrow">YOUR LAUNDRY, IN MOTION</span>
            <h2>Recent orders</h2>
          </div>
          <Link to="/account/orders">
            See all <ArrowUpRight size={15} />
          </Link>
        </div>
        {orders.length ? (
          <div className="order-list">
            {orders.slice(0, 4).map((order) => (
              <article className="order-row" key={order.id}>
                <div className="order-symbol">
                  <Shirt size={19} />
                </div>
                <div className="order-info">
                  <b>Order {order.order_number}</b>
                  <small>
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {order.service?.name || "Laundry care"}
                  </small>
                </div>
                <span className={`order-status status-${order.order_status}`}>
                  {statusLabel(order.order_status)}
                </span>
                <b className="order-amount">₹{order.total_amount}</b>
                <Link
                  to={`/account/orders?order=${order.id}`}
                  aria-label={`View order ${order.order_number}`}
                >
                  <ArrowUpRight size={17} />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          !error && (
            <div className="empty-orders">
              <div>
                <PackageCheck size={27} />
              </div>
              <h3>A clean slate.</h3>
              <p>Your first booking will show up here.</p>
              <Link className="button button-dark button-small" to="/book">
                Book your first pickup <ArrowUpRight size={15} />
              </Link>
            </div>
          )
        )}
      </section>
      <section className="account-callout">
        <div>
          <span className="eyebrow">YOUR NEXT LAUNDRY DAY</span>
          <h3>
            Let your weekend
            <br />
            belong to you.
          </h3>
        </div>
        <Link className="button button-light" to="/book">
          Schedule a pickup <ArrowUpRight size={15} />
        </Link>
        <span className="callout-flower">✳</span>
      </section>
    </div>
  );
}
