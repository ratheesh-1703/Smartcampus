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

  /* ===== FETCH LIVE STUDENT LOCATIONS ===== */
  const loadLocations = async () => {
    try {
      const res = await fetch(
        buildUrl("get_live_locations.php")
      );
      const data = await res.json();

      if (data.status) {
        setStudents(data.students);
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
      center={[9.9179, 77.7460]}   // Kalasalingam University
      zoom={17}
      style={{ height: "100vh", width: "100%" }}
    >
      {/* ===== MAP TILES ===== */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {/* ===== UNIVERSITY FIXED MARKER ===== */}
      <Marker position={[9.9179, 77.7460]}>
        <Popup>
          <b>Kalasalingam University</b><br />
          Krishnankoil, Tamil Nadu
        </Popup>
      </Marker>

      {/* ===== LIVE STUDENT MARKERS ===== */}
      {students.map((s, index) => (
        <Marker
          key={index}
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
