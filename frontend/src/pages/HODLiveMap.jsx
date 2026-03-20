import CampusLiveMap from "./CampusLiveMap";

export default function HODLiveMap() {
  return (
    <div style={{ height: "100vh" }}>
      <div className="p-3 bg-primary text-white d-flex align-items-center">
        <h5 className="m-0">HOD – Department Students Live Location</h5>
      </div>

      <CampusLiveMap />
    </div>
  );
}
