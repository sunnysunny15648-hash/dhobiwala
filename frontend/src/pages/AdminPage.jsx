import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  IndianRupee,
  PackageCheck,
  Plus,
  UsersRound,
} from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function AdminPage({ section }) {
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [clothing, setClothing] = useState([]);
  const [team, setTeam] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [report, setReport] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: "", discount_type: "percentage", discount_value: "", minimum_order_amount: "", maximum_discount: "", expiry_date: "" });
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  useEffect(() => {
    const request =
      section === "overview"
        ? api
            .get("/admin/dashboard")
            .then(({ data }) => setDashboard(data.dashboard))
        : section === "orders"
          ? api
              .get("/admin/orders")
              .then(({ data }) => setOrders(data.orders || []))
          : section === "services"
            ? Promise.all([
                api.get("/services"),
                api.get("/clothing-items"),
              ]).then(([servicesResult, clothingResult]) => {
                setServices(servicesResult.data.services || []);
                setClothing(clothingResult.data.items || []);
              })
            : section === "orders"
              ? Promise.all([
                  api.get("/admin/orders"),
                  api.get("/admin/employees"),
                ]).then(([ordersResult, teamResult]) => {
                  setOrders(ordersResult.data.orders || []);
                  setTeam(teamResult.data.employees || []);
                })
              : section === "team"
                ? api
                    .get("/admin/employees")
                    .then(({ data }) => setTeam(data.employees || []))
                : section === "customers"
                  ? api
                      .get("/admin/customers")
                      .then(({ data }) => setCustomers(data.customers || []))
                  : section === "payments"
                    ? api
                        .get("/admin/payments")
                        .then(({ data }) => setPayments(data.payments || []))
                    : section === "reports"
                      ? api.get("/admin/reports").then(({ data }) => setReport(data))
                      : section === "coupons"
                        ? api.get("/coupons").then(({ data }) => setCoupons(data.coupons || []))
                        : api.get("/reviews").then(({ data }) => setReviews(data.reviews || []));
    request.catch((err) => setError(err.message));
  }, [section]);

  async function changeStatus(order, order_status) {
    try {
      await api.patch(`/orders/${order.id}/status`, { order_status });
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, order_status } : item,
        ),
      );
      toast.success("Order status updated.");
    } catch (err) {
      toast.error(err.message);
    }
  }
  async function updateService(service) {
    const raw = window.prompt(`New price for ${service.name}`, service.price);
    if (raw === null || !Number.isFinite(Number(raw)) || Number(raw) < 0)
      return;
    try {
      await api.put(`/services/${service.id}`, { price: Number(raw) });
      setServices((current) =>
        current.map((item) =>
          item.id === service.id ? { ...item, price: Number(raw) } : item,
        ),
      );
      toast.success("Price updated.");
    } catch (err) {
      toast.error(err.message);
    }
  }
  async function addService() {
    const name = window.prompt("Service name");
    if (!name) return;
    const description = window.prompt("Short description", "Laundry care, delivered with care.");
    const price = Number(window.prompt("Starting price in rupees", "49"));
    const estimated_hours = Number(window.prompt("Estimated turnaround in hours", "24"));
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(estimated_hours) || estimated_hours < 1) return;
    try {
      const { data } = await api.post("/services", { name, description: description || "", price, estimated_hours });
      setServices((current) => [...current, data.service]);
      toast.success("Service added to the catalog.");
    } catch (err) { toast.error(err.message); }
  }
  async function deactivateService(service) {
    if (!window.confirm(`Deactivate ${service.name}? It will no longer be bookable.`)) return;
    try {
      await api.delete(`/services/${service.id}`);
      setServices((current) => current.filter((item) => item.id !== service.id));
      toast.success("Service deactivated.");
    } catch (err) { toast.error(err.message); }
  }
  async function updateClothing(item) {
    const raw = window.prompt(
      `New per-item price for ${item.name}`,
      item.price,
    );
    if (raw === null || !Number.isFinite(Number(raw)) || Number(raw) < 0)
      return;
    try {
      await api.patch(`/clothing-items/${item.id}`, { price: Number(raw) });
      setClothing((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, price: Number(raw) } : entry,
        ),
      );
      toast.success("Clothing price updated.");
    } catch (err) {
      toast.error(err.message);
    }
  }
  async function addEmployee() {
    const full_name = window.prompt("Employee name");
    if (!full_name) return;
    const email = window.prompt("Employee email address");
    if (!email) return;
    const phone = window.prompt("Employee mobile number");
    if (!phone) return;
    const password = window.prompt(
      "Temporary password (at least 10 characters)",
    );
    if (!password) return;
    try {
      const { data } = await api.post("/admin/employees", {
        full_name,
        email,
        phone,
        password,
      });
      setTeam((current) => [...current, data.employee]);
      toast.success("Employee account created.");
    } catch (err) {
      toast.error(err.message);
    }
  }
  async function assign(order, employeeId, assignmentType) {
    if (!employeeId) return;
    try {
      await api.patch(`/admin/orders/${order.id}/assign`, {
        employee_id: employeeId,
        assignment_type: assignmentType,
      });
      toast.success(
        `${assignmentType === "pickup" ? "Pickup" : "Delivery"} employee assigned.`,
      );
    } catch (err) {
      toast.error(err.message);
    }
  }
  async function changePayment(payment, payment_status) {
    try {
      await api.patch(`/admin/payments/${payment.id}`, { payment_status });
      setPayments((current) => current.map((item) => item.id === payment.id ? { ...item, payment_status } : item));
      toast.success("Payment record updated.");
    } catch (err) { toast.error(err.message); }
  }
  async function createCoupon(event) {
    event.preventDefault();
    try {
      const { data } = await api.post("/coupons", {
        ...couponForm,
        discount_value: Number(couponForm.discount_value),
        minimum_order_amount: Number(couponForm.minimum_order_amount || 0),
        maximum_discount: couponForm.maximum_discount ? Number(couponForm.maximum_discount) : null,
      });
      setCoupons((current) => [data.coupon, ...current]);
      setCouponForm({ code: "", discount_type: "percentage", discount_value: "", minimum_order_amount: "", maximum_discount: "", expiry_date: "" });
      toast.success("Coupon created.");
    } catch (err) { toast.error(err.message); }
  }
  const filteredOrders = orders.filter(
    (order) => statusFilter === "all" || order.order_status === statusFilter,
  );
  return (
    <div className="admin-content">
      {error && (
        <div className="connection-note">
          <b>Operations data is not connected.</b>
          <p>
            {error}. Configure Supabase and apply the database SQL before
            managing live records.
          </p>
        </div>
      )}
      {section === "overview" && (
        <>
          {dashboard && (
            <>
              <div className="metric-row admin-metrics">
                <Metric
                  icon={UsersRound}
                  label="CUSTOMERS"
                  value={dashboard.total_customers}
                />
                <Metric
                  icon={ClipboardList}
                  label="ALL ORDERS"
                  value={dashboard.total_orders}
                />
                <Metric
                  icon={IndianRupee}
                  label="REVENUE"
                  value={`₹${Number(dashboard.total_revenue || 0).toLocaleString("en-IN")}`}
                />
                <Metric
                  icon={PackageCheck}
                  label="NEEDS ATTENTION"
                  value={dashboard.pending_orders}
                  highlight
                />
              </div>
              <div className="admin-overview-grid">
                <section className="admin-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">THE WORK IN MOTION</span>
                      <h2>Orders today</h2>
                    </div>
                    <a href="/admin/orders">
                      View all <ArrowUpRight size={14} />
                    </a>
                  </div>
                  <div className="admin-empty">
                    <PackageCheck size={28} />
                    <p>
                      New orders will appear here as soon as customers book.
                    </p>
                  </div>
                </section>
                <section className="admin-panel report-card">
                  <span className="eyebrow">A GOOD DAY’S WORK</span>
                  <div className="report-number">
                    {dashboard.completed_orders || 0}
                    <span> orders completed</span>
                  </div>
                  <div className="report-baseline">
                    <span>Processing</span>
                    <b>{dashboard.processing_orders || 0}</b>
                  </div>
                  <div className="report-baseline">
                    <span>Today</span>
                    <b>{dashboard.today_orders || 0}</b>
                  </div>
                  <div className="report-foot">
                    <ArrowDownRight size={15} /> Keep the care moving
                  </div>
                </section>
              </div>
            </>
          )}
        </>
      )}
      {section === "orders" && (
        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">LIVE QUEUE</span>
              <h2>{orders.length} orders</h2>
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              {[
                "placed",
                "pickup_scheduled",
                "collected",
                "washing",
                "quality_check",
                "ready_for_delivery",
                "out_for_delivery",
                "delivered",
              ].map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>CUSTOMER</th>
                  <th>DATE</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>UPDATE</th>
                  <th>PICKUP</th>
                  <th>DELIVERY</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <b>{order.order_number}</b>
                    </td>
                    <td>{order.customer?.full_name || "Customer"}</td>
                    <td>{order.pickup_date}</td>
                    <td>₹{order.total_amount}</td>
                    <td>
                      <span
                        className={`order-status status-${order.order_status}`}
                      >
                        {order.order_status?.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>
                      <select
                        value={order.order_status}
                        onChange={(event) =>
                          changeStatus(order, event.target.value)
                        }
                      >
                        <option value={order.order_status}>
                          {order.order_status?.replaceAll("_", " ")}
                        </option>
                        {[
                          "collected",
                          "washing",
                          "quality_check",
                          "ready_for_delivery",
                          "out_for_delivery",
                          "delivered",
                          "cancelled",
                        ]
                          .filter((value) => value !== order.order_status)
                          .map((value) => (
                            <option key={value} value={value}>
                              {value.replaceAll("_", " ")}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td>
                      <select
                        defaultValue=""
                        onChange={(event) =>
                          assign(order, event.target.value, "pickup")
                        }
                      >
                        <option value="">Assign</option>
                        {team.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.profile?.full_name ||
                              employee.employee_code}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        defaultValue=""
                        onChange={(event) =>
                          assign(order, event.target.value, "delivery")
                        }
                      >
                        <option value="">Assign</option>
                        {team.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.profile?.full_name ||
                              employee.employee_code}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredOrders.length && (
              <div className="admin-empty">
                <p>No orders to show.</p>
              </div>
            )}
          </div>
        </section>
      )}
      {section === "services" && (
        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">LIVE CATALOG</span>
              <h2>Services & clothing prices</h2>
            </div>
            <span className="catalog-live">Database managed</span>
            <button className="button button-dark button-small" onClick={addService}><Plus size={14} /> Add service</button>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SERVICE</th>
                  <th>DESCRIPTION</th>
                  <th>TURNAROUND</th>
                  <th>PRICE</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <b>{service.name}</b>
                    </td>
                    <td>{service.description}</td>
                    <td>{service.estimated_hours} hrs</td>
                    <td>₹{service.price}</td>
                    <td>
                      <button
                        className="table-action"
                        onClick={() => updateService(service)}
                      >
                        Edit price <ArrowUpRight size={14} />
                      </button>
                      <button className="table-action" onClick={() => deactivateService(service)}>Deactivate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 className="subtable-title">Clothing item prices</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ITEM</th>
                  <th>PRICE</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clothing.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <b>{item.name}</b>
                    </td>
                    <td>₹{item.price}</td>
                    <td>
                      <button
                        className="table-action"
                        onClick={() => updateClothing(item)}
                      >
                        Edit price <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {section === "team" && (
        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">THE PEOPLE BEHIND THE CARE</span>
              <h2>Delivery team</h2>
            </div>
            <button
              className="button button-dark button-small"
              onClick={addEmployee}
            >
              <Plus size={15} /> Add employee
            </button>
          </div>
          <div className="team-grid">
            {team.map((employee) => (
              <article className="team-card" key={employee.id}>
                <span className="team-avatar">
                  {employee.profile?.full_name?.slice(0, 1) || "D"}
                </span>
                <div>
                  <b>{employee.profile?.full_name || employee.employee_code}</b>
                  <small>
                    {employee.employee_code} · {employee.availability_status}
                  </small>
                </div>
                <span className="team-ready">
                  {employee.availability_status}
                </span>
              </article>
            ))}
          </div>
          {!team.length && (
            <div className="admin-empty">
              <p>Employee profiles will appear here after they are added.</p>
            </div>
          )}
        </section>
      )}
      {section === "customers" && (
        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">CUSTOMER DIRECTORY</span>
              <h2>{customers.length} customers</h2>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>JOINED</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <b>{customer.full_name}</b>
                    </td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>
                      {new Date(customer.created_at).toLocaleDateString(
                        "en-IN",
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {section === "payments" && (
        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PAYMENT RECORDS</span>
              <h2>{payments.length} payments</h2>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>METHOD</th>
                  <th>TRANSACTION</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>UPDATE</th>
                  <th>DATE</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <b>{payment.order?.order_number || payment.order_id}</b>
                    </td>
                    <td>{payment.payment_method}</td>
                    <td>
                      {payment.transaction_id ||
                        payment.provider_order_id ||
                        "—"}
                    </td>
                    <td>₹{payment.amount}</td>
                    <td>{payment.payment_status}</td>
                    <td>{payment.payment_status === "pending" ? <select defaultValue="" onChange={(event) => changePayment(payment, event.target.value)}><option value="" disabled>Update</option><option value="succeeded">Mark paid</option><option value="failed">Mark failed</option></select> : payment.payment_status === "succeeded" ? <button className="table-action" onClick={() => changePayment(payment, "refunded")}>Mark refunded</button> : "—"}</td>
                    <td>
                      {new Date(payment.created_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {section === "coupons" && <section className="admin-panel"><div className="panel-heading"><div><span className="eyebrow">LIVE DISCOUNTS</span><h2>{coupons.length} active coupons</h2></div></div><form className="coupon-admin-form" onSubmit={createCoupon}><label>Code<input required maxLength="32" value={couponForm.code} onChange={(event) => setCouponForm({ ...couponForm, code: event.target.value.toUpperCase() })} placeholder="FRESH10" /></label><label>Type<select value={couponForm.discount_type} onChange={(event) => setCouponForm({ ...couponForm, discount_type: event.target.value })}><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></label><label>Value<input type="number" min="1" step="0.01" required value={couponForm.discount_value} onChange={(event) => setCouponForm({ ...couponForm, discount_value: event.target.value })} /></label><label>Minimum order<input type="number" min="0" step="0.01" value={couponForm.minimum_order_amount} onChange={(event) => setCouponForm({ ...couponForm, minimum_order_amount: event.target.value })} /></label><label>Max discount<input type="number" min="0" step="0.01" value={couponForm.maximum_discount} onChange={(event) => setCouponForm({ ...couponForm, maximum_discount: event.target.value })} /></label><label>Expires<input type="date" required min={new Date().toISOString().slice(0, 10)} value={couponForm.expiry_date} onChange={(event) => setCouponForm({ ...couponForm, expiry_date: event.target.value })} /></label><button className="button button-dark button-small">Create coupon</button></form><div className="table-wrap"><table className="data-table"><thead><tr><th>CODE</th><th>OFFER</th><th>MINIMUM</th><th>MAX DISCOUNT</th><th>EXPIRES</th></tr></thead><tbody>{coupons.map((coupon) => <tr key={coupon.id}><td><b>{coupon.code}</b></td><td>{coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}</td><td>₹{coupon.minimum_order_amount}</td><td>{coupon.maximum_discount ? `₹${coupon.maximum_discount}` : "—"}</td><td>{coupon.expiry_date}</td></tr>)}</tbody></table></div></section>}
      {section === "reviews" && <section className="admin-panel"><div className="panel-heading"><div><span className="eyebrow">CUSTOMER NOTES</span><h2>{reviews.length} reviews</h2></div></div><div className="review-admin-list">{reviews.map((review) => <article key={review.id}><div><b>{review.profile?.full_name || "Customer"}</b><span>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div><p>{review.comment || "No written comment."}</p><small>{new Date(review.created_at).toLocaleDateString("en-IN")}</small></article>)}</div>{!reviews.length && <div className="admin-empty"><p>Customer reviews will show here after completed orders are reviewed.</p></div>}</section>}
      {section === "reports" && report && (
        <div className="admin-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">BUSINESS PULSE</span>
              <h2>Recent performance</h2>
            </div>
            <select
              value={report.period}
              onChange={(event) =>
                api
                  .get(`/admin/reports?period=${event.target.value}`)
                  .then(({ data }) => setReport(data))
                  .catch((err) => toast.error(err.message))
              }
            >
              <option value="week">Last 7 days</option>
              <option value="month">This month</option>
              <option value="year">Last 12 months</option>
            </select>
          </div>
          <div className="report-summary">
            <b>{report.total_orders}</b>
            <span>orders in period</span>
            <b>₹{Number(report.revenue).toLocaleString("en-IN")}</b>
            <span>paid revenue</span>
          </div>
          <h3 className="subtable-title">Popular services</h3>
          {report.popular_services.map((service) => (
            <div className="report-baseline" key={service.name}>
              <span>{service.name}</span>
              <b>{service.orders} orders</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function Metric({ icon: Icon, label, value, highlight }) {
  return (
    <article
      className={`metric-card ${highlight ? "metric-card-highlight" : ""}`}
    >
      <span className="metric-icon">
        <Icon size={18} />
      </span>
      <span className="metric-label">{label}</span>
      <b>{value ?? "—"}</b>
      <small>Live database totals</small>
    </article>
  );
}
