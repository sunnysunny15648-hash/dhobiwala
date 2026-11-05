import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Clock3,
  Droplets,
  Leaf,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";

const steps = [
  [
    "01",
    "Pick your care",
    "Everyday wash, a crisp press, or something delicate.",
  ],
  [
    "02",
    "We come to you",
    "Choose a time that fits. We collect right from your door.",
  ],
  [
    "03",
    "Fresh, right back",
    "Thoughtfully cleaned and returned, ready for another day.",
  ],
];

export default function HomePage() {
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    api
      .get("/services")
      .then(({ data }) => setServices(data.services || []))
      .catch(() => setServices([]));
    api
      .get("/reviews")
      .then(({ data }) => setReviews(data.reviews || []))
      .catch(() => setReviews([]));
  }, []);
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="eyebrow-star">✳</span> A better kind of laundry day
          </span>
          <h1>
            Laundry day.
            <br />
            <em>Handled.</em>
          </h1>
          <p>
            More time for your life. Thoughtful laundry care, collected from
            your door and delivered back with a little extra love.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark" to="/book">
              Book a pickup <ArrowUpRight size={17} />
            </Link>
            <a className="quiet-link" href="#how">
              See how it works <ArrowDownRight size={16} />
            </a>
          </div>
          <div className="hero-proof">
            <div className="proof-avatars"><span><Leaf size={14} /></span></div>
            <div>
              <div className="proof-stars">MADE FOR REAL LIFE</div>
              <small>Thoughtful care, from pickup to return</small>
            </div>
          </div>
        </div>
        <div
          className="hero-art"
          role="img"
          aria-label="Freshly folded laundry ready for delivery"
        >
          <div className="hero-image" />
          <div className="art-label">
            <span className="art-label-icon">
              <Sparkles size={18} />
            </span>
            <span>
              <b>Fresh, folded, yours.</b>
              <small>Collected from your door · returned with care</small>
            </span>
          </div>
          <div className="hero-stamp">
            <span>
              GOOD
              <br />
              CLEAN
              <br />
              FEELING
            </span>
            <Leaf size={17} />
          </div>
          <div className="hero-scribble">✳</div>
        </div>
        <div className="hero-side-note">
          MADE FOR THE IN-BETWEEN MOMENTS
        </div>
      </section>
      <section className="promise-strip" id="promise">
        <span>
          <Droplets size={18} /> Gentle on your clothes
        </span>
        <span>
          <Clock3 size={18} /> On time, every time
        </span>
        <span>
          <Leaf size={18} /> Better choices, cleaner days
        </span>
        <span>
          <PackageCheck size={18} /> Doorstep-to-doorstep care
        </span>
      </section>
      <section className="section services-section" id="services">
        <div className="section-top">
          <div>
            <span className="eyebrow">A fresh start for everything</span>
            <h2>
              Care that gets
              <br />
              the little things right.
            </h2>
          </div>
          <Link className="quiet-link" to="/services">
            All services <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="service-preview-grid">
          {services.slice(0, 3).map((service, index) => (
            <article
              className={`service-preview preview-${index}`}
              key={service.id || service.name}
            >
              <div className="service-visual">
                <span>{["01", "02", "03"][index]}</span>
                {index === 0 ? (
                  <Droplets />
                ) : index === 1 ? (
                  <Sparkles />
                ) : (
                  <Leaf />
                )}
              </div>
              <div className="service-preview-copy">
                <span className="service-kicker">
                  {
                    ["THE EVERYDAY", "A LITTLE EXTRA", "HANDLE WITH CARE"][
                      index
                    ]
                  }
                </span>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <div className="service-price">
                  {service.price == null
                    ? "See pricing"
                    : `From ₹${service.price}`}{" "}
                  <ArrowUpRight size={15} />
                </div>
              </div>
            </article>
          ))}
          {!services.length && <div className="service-empty-state">Our live service menu will appear here once connected. <Link to="/services">Open services <ArrowUpRight size={14} /></Link></div>}
        </div>
      </section>
      <section className="how-section" id="how">
        <div className="how-intro">
          <span className="eyebrow">An easier kind of routine</span>
          <h2>
            Three little steps.
            <br />
            <em>One big exhale.</em>
          </h2>
          <p>
            No guessing, no waiting around. Just a simple rhythm that gives your
            day a bit more room.
          </p>
          <Link className="button button-light" to="/book">
            Let's get started <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="steps-list">
          {steps.map(([number, title, copy]) => (
            <div className="step-row" key={number}>
              <span className="step-number">{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
              <Check className="step-check" size={19} />
            </div>
          ))}
        </div>
      </section>
      {reviews[0] && <section className="testimonial-section"><div className="testimonial-mark">“</div><blockquote>{reviews[0].comment}</blockquote><div className="testimonial-byline"><span className="testimonial-avatar">{reviews[0].profile?.full_name?.slice(0, 1) || "D"}</span><span><b>{reviews[0].profile?.full_name || "Dhobi Wala customer"}</b><small>Verified order review</small></span><span className="testimonial-rating">{"★".repeat(reviews[0].rating)}</span></div></section>}
      <footer className="site-footer">
        <div>
          <span className="footer-wordmark">
            dhobi<span>wala</span>
          </span>
          <p>A little more life between laundry days.</p>
        </div>
        <div className="footer-links">
          <a href="mailto:hello@dhobiwala.com">
            Say hello <ArrowUpRight size={14} />
          </a>
          <Link to="/services">Services</Link>
          <Link to="/login">Your account</Link>
        </div>
        <small className="footer-legal">
          © 2026 Dhobi Wala · Made with care
        </small>
      </footer>
    </main>
  );
}
