import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import campusBuildings from "../data/campusBuilding";
import { buildUrl, apiCall } from "../utils/apiClient";

export default function CampusLiveMap(){

  const [students, setStudents] = useState([]);
  const [searchReg, setSearchReg] = useState("");
  const [dept, setDept] = useState(null);
  const mapRef = useRef(null);
  const markerRefs = useRef({});

  // ✅ Kalasalingam University center
  const CAMPUS_CENTER = [9.574837442206364, 77.67986197976006];

  // ✅ Campus bounds
  const CAMPUS_BOUNDS = [
    [9.5710, 77.6719],
    [9.5785, 77.6865]
  ];

  const loadDept = async () => {
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    const role = stored?.role;

    // Admin sees all students
    if (role === "admin" || role === "affairs") {
      return null; // No department filter
    }

    // For HOD, coordinator, subject_controller - get their department
    let detectedDept = stored?.user?.dept || stored?.dept || null;

    if (!detectedDept && (role === "hod" || role === "coordinator" || role === "subject_controller")) {
      try {
        const teacherId = stored?.teacher_id || stored?.linked_id || stored?.user?.teacher_id || stored?.user?.user_id || stored?.user?.id || stored?.user_id || stored?.id;
        if (teacherId) {
          const profile = await apiCall(buildUrl(`get_teacher_profile.php?id=${teacherId}`));
          if (profile.status && profile.teacher) {
            detectedDept = profile.teacher.dept || profile.teacher.department || null;
          }
        }
      } catch (e) {
        console.error("Failed to load department:", e);
      }
    }

    return detectedDept;
  };

  const loadLocations = async () => {
    const deptValue = await loadDept();
    setDept(deptValue);

    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    const role = stored?.role;
    // If HOD and no department, show error and do not fetch
    if ((role === "hod" || role === "coordinator" || role === "subject_controller") && !deptValue) {
      setStudents([]);
      return;
    }

    let url = buildUrl("get_live_locations.php");
    if (deptValue) {
      url += `?dept=${encodeURIComponent(deptValue)}`;
    }

    const res = await fetch(url);
    const data = await res.json();
    if(data.status){
      setStudents(data.students);
    }
  };

  useEffect(() => {
    loadLocations();
    const i = setInterval(loadLocations, 5000);
    return ()=>clearInterval(i);
  }, []);

  // 🔍 SEARCH STUDENT
  const searchStudent = () => {
    if(!searchReg) return;

    const student = students.find(
      s => s.reg_no.toLowerCase() === searchReg.toLowerCase()
    );

    if(!student){
      alert("Student not found");
      return;
    }

    const latlng = [student.latitude, student.longitude];

    // Move map
    mapRef.current.flyTo(latlng, 19, { duration: 1.5 });

    // Open popup
    const marker = markerRefs.current[student.reg_no];
    if(marker){
      marker.openPopup();
    }
  };

  return (
    <div style={{ height:"100vh", width:"100%" }}>

      {/* 🔍 SEARCH BAR */}
      <div style={{
        position:"absolute",
        top:15,
        left:"50%",
        transform:"translateX(-50%)",
        zIndex:1000,
        background:"white",
        padding:"10px",
        borderRadius:"8px",
        boxShadow:"0 2px 10px rgba(0,0,0,0.3)",
        display:"flex",
        gap:"8px"
      }}>
        <input
          type="text"
          placeholder="Search Register No"
          value={searchReg}
          onChange={e=>setSearchReg(e.target.value)}
          className="form-control"
          style={{ width:"200px" }}
        />
        <button
          className="btn btn-primary"
          onClick={searchStudent}
        >
          Search
        </button>
      </div>

      <MapContainer
        center={CAMPUS_CENTER}
        zoom={17}
        minZoom={16}
        maxZoom={19}
        maxBounds={CAMPUS_BOUNDS}
        maxBoundsViscosity={1}
        style={{ height:"100%", width:"100%" }}
        whenCreated={map => mapRef.current = map}
      >

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 🏫 BUILDINGS */}
        <GeoJSON
          data={campusBuildings}
          style={{
            color:"#003f88",
            weight:2,
            fillColor:"#60a5fa",
            fillOpacity:0.5
          }}
          onEachFeature={(feature, layer)=>{
            if(feature.properties?.name){
              layer.bindPopup(
                `<b>${feature.properties.name}</b>`
              );
            }
          }}
        />

        {/* 👨‍🎓 STUDENTS (unique reg_no only) */}
        {Array.from(new Map(students.map(s => [s.reg_no, s])).values()).map((s) => (
          <Marker
            key={s.reg_no}
            position={[s.latitude, s.longitude]}
            ref={ref => markerRefs.current[s.reg_no] = ref}
          >
            <Popup>
              <b>{s.name}</b><br/>
              {s.reg_no}<br/>
              {s.dept}
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    </div>
  );
}
