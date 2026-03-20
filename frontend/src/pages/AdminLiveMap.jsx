import { useState } from "react";
import CampusLiveMap from "./CampusLiveMap";

export default function AdminLiveMap() {
  const [search, setSearch] = useState("");

  return (
    <div style={{ height: "100vh" }}>
      {/* TOP BAR */}
      <div className="p-3 bg-dark text-white d-flex align-items-center">
        <h5 className="m-0 me-4">Admin – Campus Live Tracking</h5>

        <input
          type="text"
          className="form-control w-25"
          placeholder="Search Reg No / Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* MAP */}
      <CampusLiveMap search={search} />
    </div>
  );
}
