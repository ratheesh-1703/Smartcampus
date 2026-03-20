import { useEffect, useRef, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function CoordinatorSOS() {
  const [alerts, setAlerts] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [soundReady, setSoundReady] = useState(false);
  const maxSeenIdRef = useRef(0);
  const audioContextRef = useRef(null);

  const ensureAudioContext = () => {
    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioContextRef.current = new Ctx();
    }
    return audioContextRef.current;
  };

  const unlockAudio = async () => {
    try {
      const context = ensureAudioContext();
      if (!context) return;

      if (context.state === "suspended") {
        await context.resume();
      }

      setSoundReady(context.state === "running");
    } catch (error) {
      console.error("Unable to unlock audio", error);
    }
  };

  const playAlertSound = () => {
    try {
      const context = ensureAudioContext();
      if (!context || context.state !== "running") return;

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.value = 960;
      gainNode.gain.value = 0.15;

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
      }, 250);
    } catch (error) {
      console.error("Unable to play SOS alert sound", error);
    }
  };

  const loadAlerts = async () => {
    setLoading(true);
    setMessage("");

    const data = await apiCall(buildUrl("get_sos.php"));
    if (!data.status) {
      setMessage(data.message || "Failed to load SOS alerts");
      setLoading(false);
      return;
    }

    const incoming = Array.isArray(data.alerts) ? data.alerts : [];
    const incomingMaxId = incoming.reduce((max, item) => {
      const id = Number(item.id) || 0;
      return id > max ? id : max;
    }, 0);

    if (maxSeenIdRef.current > 0 && incomingMaxId > maxSeenIdRef.current) {
      playAlertSound();
    }

    if (incomingMaxId > maxSeenIdRef.current) {
      maxSeenIdRef.current = incomingMaxId;
    }

    setAlerts(incoming);
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
    const timer = setInterval(loadAlerts, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudio();
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, []);

  return (
    <div className="container mt-4">
      <div className="card p-4 shadow">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h3 className="mb-0">Class SOS Alerts</h3>
          <button className="btn btn-outline-primary btn-sm" onClick={loadAlerts} disabled={loading}>
            Refresh
          </button>
        </div>
        <p className="text-danger mb-3">Auto-refresh every 5 seconds with alert sound for new SOS.</p>

        {!soundReady && (
          <div className="alert alert-info py-2">
            Click anywhere once to enable SOS alert sound.
          </div>
        )}

        {message && <div className="alert alert-warning">{message}</div>}

        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Student</th>
                <th>Department</th>
                <th>Class</th>
                <th>Message</th>
                <th>Location</th>
                <th>Photo</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((item) => (
                <tr key={item.id}>
                  <td>{item.name} ({item.reg_no})</td>
                  <td>{item.dept || "-"}</td>
                  <td>{item.year || "-"}-{item.section || "-"}</td>
                  <td>{item.message || "-"}</td>
                  <td>
                    {item.latitude && item.longitude ? (
                      <a
                        href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Location
                      </a>
                    ) : "-"}
                  </td>
                  <td>
                    {item.photo ? (
                      <a href={buildUrl(item.photo)} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : "-"}
                  </td>
                  <td>{item.created_at ? new Date(item.created_at).toLocaleString() : "-"}</td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center">No SOS alerts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
