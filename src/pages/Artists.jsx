import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function Artists() {
  const [artists, setArtists] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.artists().then(setArtists).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <h1>Our artists</h1>
      <p className="muted">Pick the artist whose style fits your tattoo.</p>
      {error && <p className="error">{error}</p>}

      <section className="team-grid" style={{ marginTop: "1.25rem" }}>
        {artists.map((a) => (
          <article key={a.id} className="team-card">
            <div className="team-top">
              <div className="monogram">{a.name?.charAt(0).toUpperCase()}</div>
              <div className="team-name">
                <strong>{a.name}</strong>
                {a.specialization && <span className="team-tag">{a.specialization}</span>}
              </div>
            </div>

            <div className="team-meta">
              {a.experience ? <span>{a.experience} yrs experience</span> : null}
              {a.location && <span>{a.location}</span>}
            </div>

            {a.bio && <p className="team-bio">{a.bio}</p>}

            <div className="team-foot">
              <Link className="btn" to="/booking" state={{ artistId: a.id }}>
                Book with {a.name}
              </Link>
            </div>
          </article>
        ))}
      </section>

      {artists.length === 0 && !error && <p className="muted">No artists available yet.</p>}
    </>
  );
}