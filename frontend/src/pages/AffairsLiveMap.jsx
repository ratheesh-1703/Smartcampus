import { useState } from "react";
import CampusLiveMap from "./CampusLiveMap";

export default function AffairsLiveMap() {
  const [search, setSearch] = useState("");

  return (
    <div style={{ height: "100vh" }}>
      <div className="p-3 bg-danger text-white d-flex align-items-center">
        <h5 className="m-0 me-4">Student Affairs – Live Campus Map</h5>

        <input
          type="text"
          className="form-control w-25"
          placeholder="Search Student"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <CampusLiveMap search={search} />
    </div>
  );
}
