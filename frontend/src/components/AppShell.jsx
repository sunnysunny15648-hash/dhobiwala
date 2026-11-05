import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  CircleUserRound,
  Menu,
  Shirt,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Brand({ compact = false }) {
  return (
    <Link
      className={`brand ${compact ? "brand-compact" : ""}`}
      to="/"
      aria-label="Dhobi Wala home"
    >
      <span className="brand-mark">
        <Shirt size={19} strokeWidth={2.2} />
      </span>
      <span>
        dhobi<span className="brand-wala">wala</span>
        <small>CARE, COLLECTED.</small>
      </span>
    </Link>
  );
}

export function PublicHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="site-header">
      <Brand />
      <nav className="main-nav">
        <a href="/#services">Services</a>
        <a href="/#how">How it works</a>
        <a href="/#promise">Our promise</a>
      </nav>
      <div className="header-actions">
        {user ? (
          <>
            <Link
              className="text-action"
              to={
                user.role === "admin"
                  ? "/admin"
                  : user.role === "employee"
                    ? "/employee"
                    : "/account"
              }
            >
              My space <ArrowUpRight size={15} />
            </Link>
            <button
              className="avatar-button"
              title="Sign out"
              onClick={() => {
                signOut();
                navigate("/");
              }}
            >
              <CircleUserRound size={20} />
            </button>
          </>
        ) : (
          <>
            <Link className="login-link" to="/login">
              Log in
            </Link>
            <Link className="button button-dark button-small" to="/book">
              Book a pickup <ArrowUpRight size={15} />
            </Link>
          </>
        )}
      </div>
      <button
        className="mobile-menu"
        onClick={() => document.body.classList.toggle("nav-open")}
        aria-label="Toggle navigation"
      >
        <Menu />
      </button>
    </header>
  );
}

const navigation = [
  { to: "/account", label: "Overview", icon: Sparkles, end: true },
  { to: "/account/orders", label: "My orders", icon: Shirt },
  {
    to: "/account/profile",
    label: "Profile & addresses",
    icon: CircleUserRound,
  },
  { to: "/book", label: "New booking", icon: ArrowUpRight },
];

export function WorkspaceLayout({
  title,
  eyebrow,
  children,
  admin = false,
  employee = false,
}) {
  const { user, signOut } = useAuth();
  const role = admin ? "admin" : employee ? "employee" : "customer";
  const items =
    role === "admin"
      ? [
          ["/admin", "Overview"],
          ["/admin/orders", "Orders"],
          ["/admin/customers", "Customers"],
          ["/admin/services", "Services & pricing"],
          ["/admin/payments", "Payments"],
          ["/admin/coupons", "Coupons"],
          ["/admin/reviews", "Reviews"],
          ["/admin/reports", "Reports"],
          ["/admin/team", "Team"],
        ]
      : role === "employee"
        ? [
            ["/employee", "My route"],
            ["/employee/tasks", "Assigned orders"],
          ]
        : navigation.map(({ to, label }) => [to, label]);
  return (
    <div className="workspace">
      <aside className="workspace-rail">
        <Brand compact />
        <span className="rail-caption">
          {role === "customer"
            ? "YOUR ACCOUNT"
            : `${role.toUpperCase()} WORKSPACE`}
        </span>
        <nav className="rail-nav">
          {items.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/account" || to === "/admin" || to === "/employee"}
              className={({ isActive }) =>
                `rail-link ${isActive ? "active" : ""}`
              }
            >
              <span className="rail-dot" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="rail-bottom">
          <div className="profile-chip">
            <span className="profile-avatar">
              {user?.full_name?.slice(0, 1) || "D"}
            </span>
            <span>
              <b>{user?.full_name || "Dhobi Wala"}</b>
              <small>{role}</small>
            </span>
          </div>
          <button className="rail-signout" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="workspace-main">
        <header className="workspace-top">
          <Brand compact />
          <div className="workspace-top-right">
            <span className="status-dot" />
            Care is on its way
          </div>
        </header>
        <div className="workspace-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">{eyebrow}</span>
              <h1>{title}</h1>
            </div>
            {role === "customer" && (
              <Link className="button button-dark" to="/book">
                Book a pickup <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
