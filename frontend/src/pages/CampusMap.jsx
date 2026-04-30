import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { buildUrl } from "../utils/apiClient";

/* ===== FIX LEAFLET MARKER ICON ISSUE ===== */
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function CampusMap() {

  const [students, setStudents] = useState([]);
  const CAMPUS_CENTER = [9.574837442206364, 77.67986197976006];

  const uniqueStudents = Array.from(
    new Map(students.map((student) => [student.reg_no, student])).values()
  );

  /* ===== FETCH LIVE STUDENT LOCATIONS ===== */
  const loadLocations = async () => {
    try {
      const res = await fetch(
        buildUrl("get_live_locations.php")
      );
      const data = await res.json();

      if (data.status) {
        const incoming = Array.isArray(data.students) ? data.students : [];
        setStudents(incoming);
      }
    } catch (err) {
      console.error("Location fetch error:", err);
    }
  };

  /* ===== AUTO REFRESH EVERY 5 SECONDS ===== */
  useEffect(() => {
    loadLocations();
    const interval = setInterval(loadLocations, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MapContainer
      center={CAMPUS_CENTER}
      zoom={17}
      style={{ height: "100vh", width: "100%" }}
    >
      {/* ===== MAP TILES ===== */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {/* ===== UNIVERSITY FIXED MARKER ===== */}
      <Marker position={CAMPUS_CENTER}>
        <Popup>
          <b>Kalasalingam University</b><br />
          Krishnankoil, Tamil Nadu
        </Popup>
      </Marker>

      {/* ===== LIVE STUDENT MARKERS ===== */}
      {uniqueStudents.map((s) => (
        <Marker
          key={s.reg_no}
          position={[s.latitude, s.longitude]}
        >
          <Popup>
            <b>{s.name}</b><br />
            Reg No: {s.reg_no}<br />
            Dept: {s.dept}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
