<button
  className="forgot-link"
  type="button"
  onClick={async () => {
    if (!form.email) {
      toast.error("Enter your email address first.");
      return;
    }
    try {
      await api.post("/auth/password-reset", { email: form.email });
      toast.success("If that email is registered, a reset link is on its way.");
    } catch (error) {
      toast.error(error.message);
    }
  }}
>
  Forgot password?
</button>;
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function LoginPage() {
  const [register, setRegister] = useState(false);
  const [recovering, setRecovering] = useState(
    () =>
      new URLSearchParams(window.location.hash.slice(1)).get("type") ===
      "recovery",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const update = (key) => (event) =>
    setForm((value) => ({ ...value, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (recovering) {
        await api.put("/auth/password", { password: form.password });
        window.history.replaceState(null, "", "/login");
        setRecovering(false);
        toast.success("Password updated. Sign in with your new password.");
        return;
      }
      const signup = register ? await signUp(form) : null;
      if (signup?.email_confirmation_required) {
        toast.success(
          "Check your email to confirm your account, then sign in.",
        );
        setRegister(false);
        return;
      }
      const user = register
        ? signup.user
        : await signIn({ email: form.email, password: form.password });
      toast.success(register ? "Your account is ready." : "Welcome back.");
      navigate(
        user?.role === "admin"
          ? "/admin"
          : user?.role === "employee"
            ? "/employee"
            : "/account",
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-photo">
        <div className="auth-photo-inner">
          <span className="eyebrow">A little more room in your day</span>
          <p>
            Good care.
            <br />
            <em>Right at your door.</em>
          </p>
          <span className="auth-photo-caption">
            COLLECTED WITH CARE · RETURNED WITH LOVE
          </span>
        </div>
      </div>
      <section className="auth-panel">
        <Link className="back-home" to="/">
          <ArrowLeft size={15} /> Back home
        </Link>
        <div className="auth-form-wrap">
          <span className="eyebrow">
            {recovering
              ? "A SECURE RESET"
              : register
                ? "A FRESH START"
                : "YOUR SPACE, READY"}
          </span>
          <h1>
            {recovering
              ? "Choose a new password."
              : register
                ? "Make room for more."
                : "Good to see you."}
          </h1>
          <p className="auth-description">
            {recovering
              ? "Choose a new password for your account."
              : register
                ? "A few details, and we’ll take it from here."
                : "Sign in to pick up right where you left off."}
          </p>
          <form onSubmit={submit} className="auth-form">
            {register && (
              <>
                <label>
                  Your name
                  <span className="input-wrap">
                    <UserRound size={17} />
                    <input
                      autoComplete="name"
                      required
                      minLength="2"
                      value={form.full_name}
                      onChange={update("full_name")}
                      placeholder="What should we call you?"
                    />
                  </span>
                </label>
                <label>
                  Mobile number
                  <span className="input-wrap">
                    <Phone size={17} />
                    <input
                      autoComplete="tel"
                      required
                      pattern="[0-9+() -]{8,18}"
                      value={form.phone}
                      onChange={update("phone")}
                      placeholder="Your contact number"
                    />
                  </span>
                </label>
              </>
            )}
            {!recovering && (
              <label>
                Email address
                <span className="input-wrap">
                  <Mail size={17} />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={update("email")}
                    placeholder="you@example.com"
                  />
                </span>
              </label>
            )}
            <label>
              Password
              <span className="input-wrap">
                <LockKeyhole size={17} />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    register || recovering ? "new-password" : "current-password"
                  }
                  required
                  minLength="8"
                  value={form.password}
                  onChange={update("password")}
                  placeholder="At least 8 characters"
                />
                <button
                  className="input-icon-button"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
            {!register && !recovering && (
              <button
                className="forgot-link"
                type="button"
                onClick={async () => {
                  if (!form.email) {
                    toast.error("Enter your email address first.");
                    return;
                  }
                  try {
                    await api.post("/auth/password-reset", {
                      email: form.email,
                    });
                    toast.success(
                      "If that email is registered, a reset link is on its way.",
                    );
                  } catch (error) {
                    toast.error(error.message);
                  }
                }}
              >
                Forgot password?
              </button>
            )}
            <button className="button button-dark auth-submit" disabled={busy}>
              {busy
                ? "One moment…"
                : recovering
                  ? "Update password"
                  : register
                    ? "Create your account"
                    : "Sign in"}{" "}
              <ArrowUpRight size={16} />
            </button>
          </form>
          <p className="switch-auth">
            {recovering
              ? "Remembered it?"
              : register
                ? "Already have an account?"
                : "New around here?"}{" "}
            <button
              onClick={() => {
                setRecovering(false);
                setRegister(!register);
              }}
            >
              {recovering || register ? "Sign in" : "Create an account"}
            </button>
          </p>
          <p className="auth-security">
            Your account is protected with secure sign-in.
          </p>
        </div>
      </section>
    </main>
  );
}
