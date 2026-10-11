import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, fileUrl } from "../api.js";
import { useCart } from "../context/CartContext.jsx";

const STYLES = [
  "All",
  "Fine line",
  "Traditional",
  "Blackwork",
  "Realism",
  "Minimal",
];

const PLACEMENTS = [
  "Forearm",
  "Upper arm",
  "Shoulder",
  "Back",
  "Chest",
  "Ribs",
  "Thigh",
  "Calf",
  "Ankle",
  "Other",
];

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDesignTitle = (design) =>
  design?.title || design?.name || "Selected design";

export default function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const pre = location.state || {};
  const { setItem } = useCart();

  const [style, setStyle] = useState("All");
  const [designs, setDesigns] = useState([]);
  const [services, setServices] = useState([]);
  const [artists, setArtists] = useState([]);

  const [loadError, setLoadError] = useState("");
  const [designLoading, setDesignLoading] = useState(false);

  const [design, setDesign] = useState(pre.design || null);
  const [isCustom, setIsCustom] = useState(Boolean(pre.custom));

  const [custom, setCustom] = useState({
    description: "",
    placement: PLACEMENTS[0],
    referenceImageUrl: "",
  });

  const [uploading, setUploading] = useState(false);

  const [serviceId, setServiceId] = useState(
    pre.serviceId ? String(pre.serviceId) : ""
  );

  const [artistId, setArtistId] = useState(
    pre.artistId ? String(pre.artistId) : ""
  );

  const [date, setDate] = useState(today());
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [error, setError] = useState("");

  // Load services and artists.
  useEffect(() => {
    let active = true;

    Promise.all([api.services(), api.artists()])
      .then(([serviceData, artistData]) => {
        if (!active) return;

        setServices(serviceData);
        setArtists(artistData);
      })
      .catch((err) => {
        if (active) setLoadError(err.message);
      });

    return () => {
      active = false;
    };
  }, []);

  // Load designs when the selected style changes.
  useEffect(() => {
    let active = true;

    setDesignLoading(true);
    setLoadError("");

    api
      .designs(style)
      .then((data) => {
        if (active) {
          setDesigns(data);
        }
      })
      .catch((err) => {
        if (active) setLoadError(err.message);
      })
      .finally(() => {
        if (active) setDesignLoading(false);
      });

    return () => {
      active = false;
    };
  }, [style]);

  // Load available slots for the selected artist, service and date.
  useEffect(() => {
    let active = true;

    setStartTime("");
    setSlots([]);
    setError("");

    if (!artistId || !serviceId || !date) {
      setSlotsLoading(false);
      return;
    }

    setSlotsLoading(true);

    api
      .slots(artistId, serviceId, date)
      .then((data) => {
        if (active) {
          setSlots(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (active) {
          setSlots([]);
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [artistId, serviceId, date]);

  const pickDesign = (selectedDesign) => {
    setDesign(selectedDesign);
    setIsCustom(false);
    setError("");
  };

  const pickCustom = () => {
    setDesign(null);
    setIsCustom(true);
    setError("");
  };

  // Upload a custom reference image.
  const onUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Only PNG or JPG images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setError("");
    setUploading(true);

    try {
      const result = await api.uploadReference(file);

      if (!result?.url) {
        throw new Error("Image uploaded, but the server did not return its URL.");
      }

      setCustom((current) => ({
        ...current,
        referenceImageUrl: result.url,
      }));
    } catch (err) {
      setError(err.message || "Failed to upload reference image.");
    } finally {
      setUploading(false);
    }
  };

  const service = services.find(
    (item) => String(item.id) === String(serviceId)
  );

  const artist = artists.find(
    (item) => String(item.id) === String(artistId)
  );

  // Add the selected appointment details to the cart.
  const addToCart = () => {
    setError("");

    if (!design && !isCustom) {
      setError("Pick a design or choose a custom design.");
      return;
    }

    if (isCustom && custom.description.trim().length < 10) {
      setError("Describe your custom idea in at least 10 characters.");
      return;
    }

    if (uploading) {
      setError("Please wait until the image upload finishes.");
      return;
    }

    if (!service) {
      setError("Choose a service.");
      return;
    }

    if (!artist) {
      setError("Choose an artist.");
      return;
    }

    if (!date) {
      setError("Choose an appointment date.");
      return;
    }

    if (!startTime) {
      setError("Choose an available time slot.");
      return;
    }

    setItem({
      design: isCustom ? null : design,
      custom: isCustom
        ? {
            ...custom,
            description: custom.description.trim(),
          }
        : null,
      service,
      artist,
      date,
      startTime,
    });

    navigate("/cart");
  };

  const formatSlotTime = (slot) => {
    // Handles ISO timestamps and plain HH:mm or HH:mm:ss strings.
    if (typeof slot !== "string") return String(slot);

    if (/^\d{2}:\d{2}(:\d{2})?$/.test(slot)) {
      const [hours, minutes] = slot.split(":").map(Number);
      const time = new Date();
      time.setHours(hours, minutes, 0, 0);

      return time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const parsed = new Date(slot);

    if (Number.isNaN(parsed.getTime())) return slot;

    return parsed.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const designCard = (item, selected) => (
    <button
      key={item.id}
      type="button"
      className={`bk-design ${selected ? "selected" : ""}`}
      onClick={() => pickDesign(item)}
    >
      <div className="bk-design-img">
        <span className="bk-initial">
          {getDesignTitle(item).charAt(0).toUpperCase()}
        </span>
        {item.image && (
          <img
            src={fileUrl(item.image)}
            alt={getDesignTitle(item)}
            loading="lazy"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
        {selected && <span className="bk-check">✓</span>}
      </div>
      <div className="bk-design-info">
        <strong>{getDesignTitle(item)}</strong>
        {item.style && <span className="bk-style">{item.style}</span>}
      </div>
    </button>
  );

  const showDetails = design || isCustom;

  return (
    <>
      <div className="bk-head">
        <h1>Book an appointment</h1>
        <p className="muted">
          Pick a design, choose your artist, then select a time.
        </p>
      </div>

      {loadError && <p className="error">{loadError}</p>}

      <div className="bk-layout">
        <div className="bk-main">
          {/* STEP 1 */}
          <section className="bk-step">
            <div className="bk-step-title">
              <span className="bk-badge">1</span>
              <h2>Choose a design</h2>
            </div>

            <div className="chips">
              {STYLES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`chip ${style === item ? "active" : ""}`}
                  onClick={() => setStyle(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="bk-designs">
              <button
                type="button"
                className={`bk-design bk-custom ${isCustom ? "selected" : ""}`}
                onClick={pickCustom}
              >
                <span className="bk-plus">+</span>
                <strong>Custom design</strong>
                <span className="muted">
                  Describe your idea. The final price is set after a consultation.
                </span>
                {isCustom && <span className="bk-check">✓</span>}
              </button>

              {design &&
                !designs.some((item) => String(item.id) === String(design.id)) &&
                designCard(design, !isCustom)}

              {designLoading && <p className="muted">Loading designs...</p>}

              {!designLoading &&
                designs.map((item) =>
                  designCard(
                    item,
                    !isCustom && String(design?.id) === String(item.id)
                  )
                )}
            </div>

            {!designLoading && designs.length === 0 && (
              <p className="muted">No designs in this style yet.</p>
            )}
          </section>

          {showDetails && (
            <>
              {/* CUSTOM IDEA */}
              {isCustom && (
                <section className="bk-step">
                  <div className="bk-step-title">
                    <span className="bk-badge">+</span>
                    <h2>Your custom idea</h2>
                  </div>

                  <div className="form">
                    <label>
                      Describe your idea
                      <textarea
                        rows={4}
                        value={custom.description}
                        onChange={(event) =>
                          setCustom((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        placeholder="Subject, style, size, and anything else that matters."
                      />
                    </label>

                    <div className="form row">
                      <label>
                        Placement
                        <select
                          value={custom.placement}
                          onChange={(event) =>
                            setCustom((current) => ({
                              ...current,
                              placement: event.target.value,
                            }))
                          }
                        >
                          {PLACEMENTS.map((placement) => (
                            <option key={placement} value={placement}>
                              {placement}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Reference image (PNG or JPG, up to 5 MB)
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={onUpload}
                        />
                      </label>
                    </div>

                    {uploading && (
                      <p className="muted">Uploading reference image...</p>
                    )}

                    {custom.referenceImageUrl && (
                      <img
                        className="preview"
                        src={fileUrl(custom.referenceImageUrl)}
                        alt="Custom tattoo reference"
                      />
                    )}
                  </div>
                </section>
              )}

              {/* STEP 2 */}
              <section className="bk-step">
                <div className="bk-step-title">
                  <span className="bk-badge">2</span>
                  <h2>Service, artist and date</h2>
                </div>

                <div className="form row">
                  <label>
                    Service
                    <select
                      value={serviceId}
                      onChange={(event) => setServiceId(event.target.value)}
                    >
                      <option value="">Select a service</option>
                      {services.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.durationMinutes} min · ₹{item.price}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Artist
                    <select
                      value={artistId}
                      onChange={(event) => setArtistId(event.target.value)}
                    >
                      <option value="">Select an artist</option>
                      {artists.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Appointment date
                    <input
                      type="date"
                      min={today()}
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                    />
                  </label>
                </div>
              </section>

              {/* STEP 3 */}
              <section className="bk-step">
                <div className="bk-step-title">
                  <span className="bk-badge">3</span>
                  <h2>Pick a time</h2>
                </div>

                {!artistId || !serviceId ? (
                  <p className="muted">
                    Choose a service and an artist to see free times.
                  </p>
                ) : (
                  <>
                    {slotsLoading && (
                      <p className="muted">Checking the calendar...</p>
                    )}

                    {!slotsLoading && slots.length === 0 && !error && (
                      <p className="muted">
                        No free times on this date. Try another day.
                      </p>
                    )}

                    {!slotsLoading && slots.length > 0 && (
                      <div className="bk-slots">
                        {slots.map((slot, index) => (
                          <button
                            key={`${slot}-${index}`}
                            type="button"
                            className={`bk-slot ${startTime === slot ? "active" : ""}`}
                            onClick={() => {
                              setStartTime(slot);
                              setError("");
                            }}
                          >
                            {formatSlotTime(slot)}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>
            </>
          )}
        </div>

        {/* SUMMARY */}
        <aside className="bk-summary">
          <h2>Your booking</h2>

          <dl className="bk-lines">
            <div>
              <dt>Design</dt>
              <dd>
                {isCustom
                  ? "Custom design"
                  : design
                  ? getDesignTitle(design)
                  : "Not chosen yet"}
              </dd>
            </div>
            <div>
              <dt>Service</dt>
              <dd>{service ? service.name : "—"}</dd>
            </div>
            <div>
              <dt>Artist</dt>
              <dd>{artist ? artist.name : "—"}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{date || "—"}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{startTime ? formatSlotTime(startTime) : "—"}</dd>
            </div>
          </dl>

          {service && (
            <div className="bk-price">
              <div>
                <span className="muted">Service price</span>
                <strong>₹{service.price}</strong>
              </div>
              <div>
                <span className="muted">Deposit due now</span>
                <strong className="bk-deposit">₹{service.depositAmount}</strong>
              </div>
            </div>
          )}

          {error && <p className="error">{error}</p>}

          <button
            type="button"
            className="btn bk-submit"
            onClick={addToCart}
            disabled={uploading || slotsLoading}
          >
            {uploading ? "Uploading..." : "Add to cart"}
          </button>
        </aside>
      </div>
    </>
  );
}