import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Clock3,
  Droplets,
  Leaf,
  Shirt,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";

const icons = [Droplets, Shirt, Sparkles, Leaf];
export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/services")
      .then(({ data }) => setServices(data.services || []))
      .catch((err) => setError(err.message));
  }, []);
  return (
    <main className="catalog-page">
      <div className="catalog-heading">
        <span className="eyebrow">YOUR WARDROBE, WELL LOOKED AFTER</span>
        <h1>
          A little care goes
          <br />
          <em>a long way.</em>
        </h1>
        <p>
          Choose the care that suits your day. Our team takes it from there.
        </p>
      </div>
      {error && (
        <div className="connection-note">
          <span className="status-dot status-dot-warn" />
          <div>
            <b>Service menu needs a connection</b>
            <p>
              {error}. Add your Supabase settings and run the database scripts
              to load the live catalog.
            </p>
          </div>
        </div>
      )}
      <div className="catalog-grid">
        {services.map((service, index) => {
          const Icon = icons[index % icons.length];
          return (
            <article className="catalog-card" key={service.id}>
              <div className={`catalog-art catalog-art-${index % 4}`}>
                <Icon size={34} strokeWidth={1.4} />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="catalog-card-body">
                <div className="catalog-card-top">
                  <h2>{service.name}</h2>
                  <span className="price-tag">
                    ₹{service.price}
                    {service.unit ? ` / ${service.unit}` : ""}
                  </span>
                </div>
                <p>{service.description}</p>
                <div className="catalog-meta">
                  <span>
                    <Clock3 size={15} /> {service.estimated_hours} hrs
                  </span>
                  <Link to="/book" aria-label={`Book ${service.name}`}>
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!services.length && !error && (
        <div className="loading-inline">
          <span className="spinner" />
          Loading live services
        </div>
      )}
      <div className="catalog-bottom">
        <span>Not sure what your clothes need?</span>
        <Link to="/book">
          Tell us what you have <ArrowUpRight size={15} />
        </Link>
      </div>
    </main>
  );
}
