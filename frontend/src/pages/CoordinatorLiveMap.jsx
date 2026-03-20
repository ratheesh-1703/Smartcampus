import CampusLiveMap from "./CampusLiveMap";

export default function CoordinatorLiveMap() {
  return (
    <div style={{ height: "100vh" }}>
      <div className="p-3 bg-success text-white d-flex align-items-center">
        <h5 className="m-0">Coordinator – Class Students Live Location</h5>
      </div>

      <CampusLiveMap />
    </div>
  );
}
