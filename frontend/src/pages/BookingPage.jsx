import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

const slots = ["8 AM – 10 AM", "10 AM – 12 PM", "12 PM – 2 PM", "4 PM – 6 PM"];
const today = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

export default function BookingPage() {
  const [services, setServices] = useState([]);
  const [items, setItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [quantities, setQuantities] = useState({});
  const [step, setStep] = useState(1);
  const [pickup, setPickup] = useState({
    pickup_date: today,
    pickup_slot: "",
    address_id: "",
    address_line: "",
    city: "",
    pincode: "",
    phone: "",
    special_instructions: "",
    payment_method: "cod",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get("/services"),
      api.get("/clothing-items"),
      api.get("/users/addresses"),
    ])
      .then(([serviceResult, itemResult, addressResult]) => {
        const liveServices = serviceResult.data.services || [];
        setServices(liveServices);
        setItems(itemResult.data.items || []);
        const saved = addressResult.data.addresses || [];
        setAddresses(saved);
        setSelectedService(liveServices[0]?.id || "");
        const primary = saved.find((address) => address.is_default) || saved[0];
        if (primary)
          setPickup((current) => ({ ...current, address_id: primary.id }));
      })
      .catch((err) => setError(err.message));
  }, []);

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * (quantities[item.id] || 0),
    0,
  );
  const servicePrice = Number(
    services.find((service) => service.id === selectedService)?.price || 0,
  );
  const estimate = subtotal + servicePrice - Number(coupon?.discount || 0);
  const selectedAddress = addresses.find(
    (address) => address.id === pickup.address_id,
  );
  const readyForReview =
    selectedService && Object.values(quantities).some((qty) => qty > 0);

  async function applyCoupon() {
    setCouponBusy(true);
    try {
      const { data } = await api.post("/coupons/validate", {
        code: couponCode,
        subtotal: subtotal + servicePrice,
      });
      setCoupon(data);
      toast.success(`Coupon applied. You save ₹${data.discount}.`);
    } catch (err) {
      setCoupon(null);
      toast.error(err.message);
    } finally {
      setCouponBusy(false);
    }
  }

  async function placeOrder() {
    setBusy(true);
    try {
      let addressId = pickup.address_id;
      if (!addressId) {
        const { data } = await api.post("/users/addresses", {
          address_line: pickup.address_line,
          city: pickup.city,
          pincode: pickup.pincode,
          phone: pickup.phone,
          is_default: addresses.length === 0,
        });
        addressId = data.address.id;
      }
      const { data } = await api.post("/orders", {
        service_id: selectedService,
        address_id: addressId,
        pickup_date: pickup.pickup_date,
        pickup_slot: pickup.pickup_slot,
        special_instructions: pickup.special_instructions,
        coupon_code: coupon?.coupon?.code || undefined,
        payment_method: pickup.payment_method,
        items: items
          .filter((item) => quantities[item.id] > 0)
          .map((item) => ({
            clothing_item_id: item.id,
            quantity: quantities[item.id],
          })),
      });
      if (pickup.payment_method === "razorpay") {
        if (!window.Razorpay) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = resolve;
            script.onerror = () =>
              reject(new Error("Online checkout could not be loaded."));
            document.body.appendChild(script);
          });
        }
        const { data: payment } = await api.post("/payments/create", {
          order_id: data.order.id,
        });
        new window.Razorpay({
          key: payment.key_id,
          amount: Math.round(Number(payment.payment.amount) * 100),
          currency: "INR",
          name: "Dhobi Wala",
          description: `Laundry order ${data.order.order_number}`,
          order_id: payment.provider_order_id,
          handler: async (response) => {
            try {
              await api.post("/payments/verify", response);
              toast.success("Payment confirmed. Your pickup is booked.");
              navigate(
                `/account/orders?new=${encodeURIComponent(data.order.order_number)}`,
              );
            } catch (verificationError) {
              toast.error(verificationError.message);
            }
          },
          modal: {
            ondismiss: () =>
              toast("Your order is saved. Payment is still pending."),
          },
        }).open();
        return;
      }
      toast.success("Pickup booked. We’ll take it from here.");
      navigate(
        `/account/orders?new=${encodeURIComponent(data.order.order_number)}`,
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  function updatePickup(key, value) {
    setPickup((current) => ({ ...current, [key]: value }));
  }
  return (
    <main className="booking-page">
      <header className="booking-header">
        <Link to="/">
          <ArrowLeft size={17} /> Back to home
        </Link>
        <span className="booking-brand">
          dhobi<span>wala</span>
        </span>
        <span className="secure-check">
          <Check size={14} /> Secure booking
        </span>
      </header>
      <div className="booking-layout">
        <section className="booking-main">
          <div className="booking-title">
            <span className="eyebrow">A FRESH START</span>
            <h1>
              Let’s get your
              <br />
              <em>laundry sorted.</em>
            </h1>
            <p>Tell us what needs a little care. We’ll handle the rest.</p>
          </div>
          <div className="booking-progress">
            <div className={step >= 1 ? "current" : ""}>
              <span>1</span> Your laundry
            </div>
            <i />
            <div className={step >= 2 ? "current" : ""}>
              <span>2</span> Pickup details
            </div>
            <i />
            <div className={step >= 3 ? "current" : ""}>
              <span>3</span> Review
            </div>
          </div>
          {error ? (
            <div className="connection-note booking-error">
              <b>We can’t load the live booking menu yet.</b>
              <p>
                {error}. Configure the backend and database to begin a real
                booking.
              </p>
              <Link to="/services">
                See how our services work <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="booking-section">
                  <div className="booking-section-heading">
                    <span>01 — CHOOSE YOUR CARE</span>
                    <small>Prices are calculated from our live catalog</small>
                  </div>
                  <div className="choice-list">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => setSelectedService(service.id)}
                        className={`service-choice ${selectedService === service.id ? "chosen" : ""}`}
                      >
                        <span className="choice-radio">
                          {selectedService === service.id && <span />}
                        </span>
                        <span className="choice-content">
                          <b>{service.name}</b>
                          <small>{service.description}</small>
                        </span>
                        <span className="choice-price">₹{service.price}</span>
                      </button>
                    ))}
                  </div>
                  <div className="booking-section-heading clothing-heading">
                    <span>02 — WHAT’S IN THE BAG?</span>
                    <small>Add the pieces you’re sending</small>
                  </div>
                  <div className="clothing-list">
                    {items.map((item) => (
                      <div className="clothing-row" key={item.id}>
                        <span className="clothing-symbol">
                          <ShoppingBag size={18} />
                        </span>
                        <div className="clothing-copy">
                          <b>{item.name}</b>
                          <small>₹{item.price} each</small>
                        </div>
                        <span className="clothing-subtotal">
                          ₹{Number(item.price) * (quantities[item.id] || 0)}
                        </span>
                        <div className="stepper">
                          <button
                            onClick={() =>
                              setQuantities((current) => ({
                                ...current,
                                [item.id]: Math.max(
                                  0,
                                  (current[item.id] || 0) - 1,
                                ),
                              }))
                            }
                            aria-label={`Remove one ${item.name}`}
                          >
                            <Minus size={14} />
                          </button>
                          <span>{quantities[item.id] || 0}</span>
                          <button
                            onClick={() =>
                              setQuantities((current) => ({
                                ...current,
                                [item.id]: (current[item.id] || 0) + 1,
                              }))
                            }
                            aria-label={`Add one ${item.name}`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="button button-dark booking-next"
                    disabled={!readyForReview}
                    onClick={() => setStep(2)}
                  >
                    Pickup details <ArrowRight size={16} />
                  </button>
                </div>
              )}
              {step === 2 && (
                <div className="booking-section pickup-form">
                  <div className="booking-section-heading">
                    <span>03 — WHERE & WHEN?</span>
                    <small>Choose a time that works for you</small>
                  </div>
                  <label>
                    Pickup date
                    <input
                      type="date"
                      min={today}
                      value={pickup.pickup_date}
                      onChange={(event) =>
                        updatePickup("pickup_date", event.target.value)
                      }
                      required
                    />
                  </label>
                  <fieldset>
                    <legend>Pickup window</legend>
                    <div className="slot-grid">
                      {slots.map((slot) => (
                        <button
                          type="button"
                          key={slot}
                          className={
                            pickup.pickup_slot === slot ? "slot-active" : ""
                          }
                          onClick={() => updatePickup("pickup_slot", slot)}
                        >
                          <Clock3 size={14} />
                          {slot}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <label>Pickup address</label>
                  {addresses.length > 0 && (
                    <select
                      value={pickup.address_id}
                      onChange={(event) =>
                        updatePickup("address_id", event.target.value)
                      }
                    >
                      <option value="">Add a new address</option>
                      {addresses.map((address) => (
                        <option value={address.id} key={address.id}>
                          {address.address_line}, {address.city}
                        </option>
                      ))}
                    </select>
                  )}
                  {!pickup.address_id && (
                    <div className="address-inputs">
                      <input
                        required
                        placeholder="House / street / area"
                        value={pickup.address_line}
                        onChange={(event) =>
                          updatePickup("address_line", event.target.value)
                        }
                      />
                      <div>
                        <input
                          required
                          placeholder="City"
                          value={pickup.city}
                          onChange={(event) =>
                            updatePickup("city", event.target.value)
                          }
                        />
                        <input
                          required
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          placeholder="Pincode"
                          value={pickup.pincode}
                          onChange={(event) =>
                            updatePickup("pincode", event.target.value)
                          }
                        />
                      </div>
                      <input
                        required
                        placeholder="Mobile number"
                        value={pickup.phone}
                        onChange={(event) =>
                          updatePickup("phone", event.target.value)
                        }
                      />
                    </div>
                  )}
                  <label>
                    Anything we should know?{" "}
                    <textarea
                      rows="3"
                      maxLength="500"
                      placeholder="A note for our laundry team (optional)"
                      value={pickup.special_instructions}
                      onChange={(event) =>
                        updatePickup("special_instructions", event.target.value)
                      }
                    />
                  </label>
                  <div className="booking-form-actions">
                    <button className="text-action" onClick={() => setStep(1)}>
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button
                      className="button button-dark"
                      disabled={
                        !pickup.pickup_slot ||
                        !pickup.pickup_date ||
                        (!pickup.address_id &&
                          (!pickup.address_line ||
                            !pickup.city ||
                            !pickup.pincode ||
                            !pickup.phone))
                      }
                      onClick={() => setStep(3)}
                    >
                      Review booking <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="booking-section review-section">
                  <div className="booking-section-heading">
                    <span>04 — THE FINAL CHECK</span>
                    <small>Choose how you’d like to pay</small>
                  </div>
                  <div className="review-block">
                    <div className="review-line">
                      <span>Service</span>
                      <b>
                        {
                          services.find(
                            (service) => service.id === selectedService,
                          )?.name
                        }
                      </b>
                    </div>
                    {items
                      .filter((item) => quantities[item.id] > 0)
                      .map((item) => (
                        <div className="review-line" key={item.id}>
                          <span>
                            {item.name} × {quantities[item.id]}
                          </span>
                          <b>₹{Number(item.price) * quantities[item.id]}</b>
                        </div>
                      ))}
                    <div className="review-line">
                      <span>Pickup & delivery</span>
                      <b>Calculated at checkout</b>
                    </div>
                    <div className="review-line">
                      <span>Service charge</span>
                      <b>₹{servicePrice}</b>
                    </div>
                    {coupon && (
                      <div className="review-line coupon-savings">
                        <span>Coupon · {coupon.coupon.code}</span>
                        <b>−₹{coupon.discount}</b>
                      </div>
                    )}
                    <div className="review-total">
                      <span>Estimated total</span>
                      <b>₹{estimate}</b>
                    </div>
                  </div>
                  <div className="coupon-entry">
                    <input
                      aria-label="Coupon code"
                      placeholder="Have a coupon?"
                      value={couponCode}
                      onChange={(event) => {
                        setCouponCode(event.target.value.toUpperCase());
                        setCoupon(null);
                      }}
                    />
                    <button
                      type="button"
                      disabled={!couponCode || couponBusy}
                      onClick={applyCoupon}
                    >
                      {couponBusy ? "Checking…" : coupon ? "Applied" : "Apply"}
                    </button>
                  </div>
                  <div className="review-block pickup-review">
                    <span className="review-icon">
                      <MapPin size={18} />
                    </span>
                    <div>
                      <b>
                        {selectedAddress
                          ? selectedAddress.address_line
                          : pickup.address_line}
                      </b>
                      <p>
                        {selectedAddress
                          ? `${selectedAddress.city}, ${selectedAddress.pincode}`
                          : `${pickup.city}, ${pickup.pincode}`}
                        <br />
                        {pickup.pickup_date} · {pickup.pickup_slot}
                      </p>
                    </div>
                    <button onClick={() => setStep(2)}>Edit</button>
                  </div>
                  <label className="payment-choice">
                    <input
                      type="radio"
                      checked={pickup.payment_method === "cod"}
                      onChange={() => updatePickup("payment_method", "cod")}
                    />{" "}
                    Cash on delivery{" "}
                    <small>Pay when your fresh laundry arrives</small>
                  </label>
                  <label className="payment-choice">
                    <input
                      type="radio"
                      checked={pickup.payment_method === "razorpay"}
                      onChange={() =>
                        updatePickup("payment_method", "razorpay")
                      }
                    />{" "}
                    Pay online <small>Secure Razorpay checkout</small>
                  </label>
                  <div className="booking-form-actions">
                    <button className="text-action" onClick={() => setStep(2)}>
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button
                      className="button button-dark"
                      disabled={busy}
                      onClick={placeOrder}
                    >
                      {busy
                        ? "Booking…"
                        : pickup.payment_method === "razorpay"
                          ? "Continue to payment"
                          : "Confirm pickup"}{" "}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
        <aside className="booking-summary">
          <div className="summary-sticker">
            <span>
              YOUR
              <br />
              FRESH
              <br />
              START
            </span>
            <span className="summary-sticker-symbol">✳</span>
          </div>
          <h3>Your bag, so far.</h3>
          <p>We’ll keep your estimate up to date as you go.</p>
          <div className="summary-mini-lines">
            {selectedService && (
              <div>
                <span>
                  {
                    services.find((service) => service.id === selectedService)
                      ?.name
                  }
                </span>
                <b>₹{servicePrice}</b>
              </div>
            )}
            {items
              .filter((item) => quantities[item.id] > 0)
              .map((item) => (
                <div key={item.id}>
                  <span>
                    {item.name} × {quantities[item.id]}
                  </span>
                  <b>₹{Number(item.price) * quantities[item.id]}</b>
                </div>
              ))}
            {coupon && (
              <div className="coupon-savings">
                <span>Coupon · {coupon.coupon.code}</span>
                <b>−₹{coupon.discount}</b>
              </div>
            )}
            {!subtotal && !servicePrice && (
              <span className="summary-empty">
                Your pieces will appear here.
              </span>
            )}
          </div>
          <div className="summary-total">
            <span>Estimated total</span>
            <b>₹{estimate}</b>
          </div>
          <small className="summary-footnote">
            Final pricing is verified by our team before processing. Taxes and
            pickup charges, if any, are shown before confirmation.
          </small>
          <div className="summary-promise">
            <Check size={16} />
            <span>Every order gets our full attention.</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
