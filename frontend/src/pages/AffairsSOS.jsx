import { useEffect, useRef, useState } from "react";
import { BASE_URL, buildUrl } from "../utils/apiClient";

export default function AffairsSOS(){

  const [alerts,setAlerts] = useState([]);
  const [msg,setMsg] = useState("");
  const [busyId, setBusyId] = useState(null);
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

  const loadAlerts = async ()=>{
    try {
      const res = await fetch(buildUrl(`get_sos.php?_ts=${Date.now()}`), { cache: "no-store" });
      const data = await res.json();

      console.log("SOS FETCH", data);

      if(data.status){
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
      setMsg("");
      } else {
        setAlerts([]);
        setMsg(data?.message || "No SOS Alerts Found");
      }
    } catch {
      setAlerts([]);
      setMsg("Unable to load SOS alerts. Please check connection.");
    }
  };

  useEffect(()=>{
    loadAlerts();

    const i = setInterval(loadAlerts, 5000);
    return ()=>clearInterval(i);
  },[]);

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

  const completeSOS = async (id)=>{
    if(!id || busyId) return;
    setBusyId(id);

    try {
      const res = await fetch(buildUrl("resolve_sos.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });

      const data = await res.json();
      if(data?.status){
        setMsg("SOS marked as completed");
        await loadAlerts();
      } else {
        setMsg(data?.message || "Failed to complete SOS");
      }
    } catch {
      setMsg("Network error while completing SOS");
    } finally {
      setBusyId(null);
    }
  };

  return(
    <div className="container mt-4">
      <div className="card p-4 shadow">

        <div className="d-flex justify-content-between align-items-center mb-2">
          <h3 className="mb-0">🚨 Live SOS Alerts</h3>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => { unlockAudio(); playAlertSound(); }}>
            Test Sound
          </button>
        </div>
        <p className="text-danger mb-2">System checks every 5 seconds with alert sound for new SOS.</p>

        {!soundReady && (
          <div className="alert alert-info py-2">
            Click anywhere once to enable SOS alert sound.
          </div>
        )}

        {msg && <p className="text-danger">{msg}</p>}

        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Student</th>
              <th>Message</th>
              <th>Location</th>
              <th>Photo</th>
              <th>Time</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {alerts.map((s,i)=>(
              <tr key={i}>
                <td>{s.name} ({s.reg_no})</td>
                <td>{s.message}</td>

                <td>
                  <a target="_blank"
                     href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`}>
                     View Location
                  </a>
                </td>

                <td>
                  {s.photo
                    ? <a target="_blank"
                         href={`${BASE_URL.replace(/\/backend$/, "")}/uploads/${s.photo}`}>
                        View Photo
                      </a>
                    : "No Photo"}
                </td>

                <td>{s.created_at}</td>
                <td className="text-nowrap">
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => completeSOS(s.id)}
                    disabled={busyId === s.id}
                  >
                    {busyId === s.id ? "Completing..." : "Complete"}
                  </button>
                </td>
              </tr>
            ))}

            {alerts.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center">
                  No Active SOS Alerts
                </td>
              </tr>
            )}

          </tbody>
        </table>

      </div>
    </div>
  );
}
