import { useEffect, useRef, useState } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function AdminSOSAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [soundReady, setSoundReady] = useState(false);
  const seenAlertKeysRef = useRef(new Set());
  const initializedRef = useRef(false);
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

  const playAlertSound = async () => {
    try {
      const context = ensureAudioContext();
      if (!context) return;
      if (context.state === "suspended") {
        await context.resume();
      }
      if (context.state !== "running") return;
      setSoundReady(true);

      const beep = (frequency, delay) => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.type = "square";
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.25;
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.start(context.currentTime + delay);
        oscillator.stop(context.currentTime + delay + 0.18);
      };

      beep(1050, 0);
      beep(760, 0.22);
    } catch (error) {
      console.error("Unable to play SOS alert sound", error);
    }
  };

  const loadAlerts = async () => {
    setLoading(true);
    setMessage("");
    const data = await apiCall(buildUrl("get_sos.php"));
    if (data.status) {
      const incoming = Array.isArray(data.alerts) ? data.alerts : [];
      const incomingKeys = incoming.map((item) => `${item.id ?? ""}|${item.created_at ?? ""}`);

      if (initializedRef.current) {
        const hasNewAlert = incomingKeys.some((key) => !seenAlertKeysRef.current.has(key));
        if (hasNewAlert) {
          playAlertSound();
        }
      }

      seenAlertKeysRef.current = new Set(incomingKeys);
      initializedRef.current = true;

      setAlerts(incoming);
    } else {
      setMessage(data.message || "Failed to load SOS alerts");
    }
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
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mt-3">
        <h2>SOS Alerts</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => { unlockAudio(); playAlertSound(); }}>
            Test Sound
          </button>
          <button className="btn btn-outline-primary" onClick={loadAlerts} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <p className="text-danger mt-2 mb-0">Auto-refresh every 5 seconds with alert sound for new SOS.</p>

      {!soundReady && (
        <div className="alert alert-info mt-3 mb-0 py-2">
          Click anywhere once to enable SOS alert sound.
        </div>
      )}

      {message && (
        <div className="alert alert-warning mt-3">
          {message}
        </div>
      )}

      <div className="card p-3 mt-3">
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Student</th>
                <th>Reg No</th>
                <th>Message</th>
                <th>Photo</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td>{alert.name}</td>
                  <td>{alert.reg_no}</td>
                  <td>{alert.message}</td>
                  <td>
                    {alert.photo ? (
                      <a href={buildUrl(alert.photo)} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{alert.created_at ? new Date(alert.created_at).toLocaleString() : "-"}</td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">No SOS alerts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
