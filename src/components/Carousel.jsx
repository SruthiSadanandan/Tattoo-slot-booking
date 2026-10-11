import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Carousel({ slides, interval = 5000 }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = () => setIndex((i) => (i - 1 + count) % count);

  // Re-runs on index change, so clicking a dot or arrow restarts the timer
  useEffect(() => {
    if (paused || count < 2) return;
    const t = setInterval(next, interval);
    return () => clearInterval(t);
  }, [paused, next, interval, count, index]);

  return (
    <section
      className="carousel"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((s, i) => (
          <div
            key={s.title}
            className="carousel-slide"
            aria-hidden={i !== index}
            style={{ backgroundImage: `var(--hero-overlay), url(${s.image})` }}
          >
            <div className="carousel-content">
              <h1>{s.title}</h1>
              <p>{s.text}</p>
              <Link className="btn" to={s.to} tabIndex={i === index ? 0 : -1}>{s.cta}</Link>
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button className="carousel-arrow left" onClick={prev} aria-label="Previous slide">‹</button>
          <button className="carousel-arrow right" onClick={next} aria-label="Next slide">›</button>
          <div className="carousel-dots">
            {slides.map((s, i) => (
              <button
                key={s.title}
                className={i === index ? "dot active" : "dot"}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}