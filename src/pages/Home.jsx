import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import Carousel from "../components/Carousel.jsx";

const POPULAR = ["Fine line", "Traditional", "Blackwork", "Realism", "Minimal"];
const STEPS = [
  { title: "Choose a design", text: "Browse the gallery or describe your own idea." },
  { title: "Choose an artist", text: "Pick the artist whose style fits your tattoo." },
  { title: "Book an appointment", text: "Select a free time and pay a small deposit to hold it." },
];
const SLIDES = [
  { title: "Your story, your ink.", text: "Custom tattoos created by artists who listen first.", cta: "Book appointment", to: "/booking", image: "/carousel-1.jpg" },
  { title: "Fine line, done right.", text: "Delicate detail from artists who specialise in it.", cta: "Explore designs", to: "/designs?style=Fine%20line", image: "/carousel-2.jpg" },
  { title: "Meet the artists.", text: "Find the style that fits your skin and your story.", cta: "View artists", to: "/artists", image: "/carousel-3.png" },
];

export default function Home() {
  const [artists, setArtists] = useState(null);
  const [services, setServices] = useState(null);
  const [artistsError, setArtistsError] = useState("");
  const [servicesError, setServicesError] = useState("");

  // Separate requests: one failing must not hide the other
  useEffect(() => {
    api.artists()
      .then((a) => setArtists(a.slice(0, 3)))
      .catch((e) => setArtistsError(e.message));
    api.services()
      .then((s) => setServices(s.slice(0, 3)))
      .catch((e) => setServicesError(e.message));
  }, []);

  return (
    <>
      <Carousel slides={SLIDES} />

      <section className="block">
        <h2>Popular designs</h2>
        <div className="chips">
          {POPULAR.map((s) => (
            <Link key={s} className="chip" to={`/designs?style=${encodeURIComponent(s)}`}>{s}</Link>
          ))}
        </div>
      </section>

      <section className="block">
        <div className="block-head">
          <h2>Featured artists</h2>
          <Link to="/artists">View all artists</Link>
        </div>
        {artistsError && <p className="error">Could not load artists: {artistsError}</p>}
        {artists?.length === 0 && <p className="muted">No artists added yet.</p>}
        <div className="team-grid">
          {artists?.map((a) => (
            <Link key={a.id} className="team-card" to="/booking" state={{ artistId: a.id }}>
              <div className="team-top">
                <div className="monogram">{(a.name || "?").charAt(0).toUpperCase()}</div>
                <div className="team-name">
                  <strong>{a.name || `Artist ${a.id}`}</strong>
                  {a.specialization && <span className="team-tag">{a.specialization}</span>}
                </div>
              </div>
              <div className="team-meta">
                {a.experience ? <span>{a.experience} yrs experience</span> : null}
                {a.location && <span>{a.location}</span>}
              </div>
              <span className="team-link">Book now →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="block">
  <div className="block-head">
    <h2>Services</h2>
    <Link to="/services">See all services</Link>
  </div>
  {servicesError && <p className="error">Could not load services: {servicesError}</p>}
  <div className="svc-grid">
    {services?.map((s, i) => (
      <Link key={s.id} className="svc-card" to="/booking" state={{ serviceId: s.id }}>
        <span className="svc-num">{String(i + 1).padStart(2, "0")}</span>
        <strong className="svc-name">{s.name}</strong>
        <span className="svc-time">{s.durationMinutes} min</span>
        <div className="svc-foot">
          <div className="svc-price">
            <small>From</small>
            <span>₹{s.price}</span>
          </div>
          <span className="svc-arrow">→</span>
        </div>
      </Link>
    ))}

    <Link className="svc-card svc-custom" to="/booking" state={{ custom: true }}>
      <span className="svc-num">+</span>
      <strong className="svc-name">Custom</strong>
      <span className="muted">Your own idea. Price is set after a consultation.</span>
      <div className="svc-foot">
        <div className="svc-price"><span>Get a quote</span></div>
        <span className="svc-arrow">→</span>
      </div>
    </Link>
  </div>
</section>

      <section className="block">
        <h2>How it works</h2>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.title}>
              <strong>{s.title}</strong>
              <span className="muted">{s.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="block cta">
        <h2>Ready when you are</h2>
        <Link className="btn" to="/booking">Book appointment</Link>
      </section>
    </>
  );
}